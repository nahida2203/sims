import { segment } from 'icqq';
import plugin from '../../../lib/plugins/plugin.js';
import puppeteer from "../../../lib/puppeteer/puppeteer.js";
import {
    saveUserData,
    loadAllUsers,
    checkUserData,
} from '../function/function.js';
import { checkCooldown, setCooldown } from '../function/cooldown.js';
import fs from 'fs';
import path from 'path';
import Redis from 'ioredis';
const _path = process.cwd().replace(/\\/g, "/");
const redis = new Redis();
const loadCinemaConfig = () => {
    const config = JSON.parse(fs.readFileSync(`${_path}/plugins/sims-plugin/data/cinema/movies.json`, 'utf8'));
    return config;
};

export class CinemaSystem extends plugin {
    constructor() {
        super({
            name: 'CinemaSystem',
            dsc: '模拟人生电影院系统',
            event: 'message',
            priority: 600,
            rule: [
                { reg: '^#购买电影院$', fnc: 'buyCinema' },
                { reg: '^#电影院信息$', fnc: 'showCinemaInfo' },
                { reg: '^#购买影厅.*$', fnc: 'buyTheater' },
                { reg: '^#升级影厅.*$', fnc: 'upgradeTheater' },
                { reg: '^#购买电影.*$', fnc: 'buyMovie' },
                { reg: '^#排片.*$', fnc: 'scheduleMovie' },
                { reg: '^#购买设施.*$', fnc: 'buyFacility' },
                { reg: '^#雇佣员工.*$', fnc: 'hireStaff' },
                { reg: '^#培训员工.*$', fnc: 'trainStaff' },
                { reg: '^#电影院攻略$', fnc: 'showCinemaGuide' },
                { reg: '^#电影院排行榜$', fnc: 'showCinemaRanking' }
            ]
        });
        this.task = {
            cron: '0 * * * *',
            name: 'UpdateCinemaData',
            fnc: () => this.updateCinemaData()
        };
    }

    async buyCinema(e) {
        const remainingTime = checkCooldown(e.user_id, 'cinema', 'buy');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData) {
            e.reply("请先使用 #开始模拟人生 注册成为玩家！");
            return;
        }

        if (userData.cinema) {
            e.reply("你已经拥有一家电影院了！");
            return;
        }

        // 检查金钱是否足够
        const cinemaCost = 100000; // 基础电影院价格
        if (userData.money < cinemaCost) {
            e.reply(`你的金钱不足，购买电影院需要${cinemaCost}元。`);
            return;
        }

        // 设置电影院相关数据
        userData.money -= cinemaCost;
        userData.cinema = {
            name: `${userData.name}的电影院`,
            theaters: [],
            movies: [],
            facilities: [],
            staff: [],
            dailyRevenue: 0,
            totalRevenue: 0,
            reputation: 50,
            maintenanceCost: 0,
            staffCost: 0,
            lastUpdate: Date.now()
        };

        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        setCooldown(e.user_id, 'cinema', 'buy');

        let data = {
            name: userData.name,
            cinemaName: userData.cinema.name,
            cost: cinemaCost,
            money: userData.money
        };

        await this.renderCinemaImage(e, 'cinema_buy', data);
    }

    async showCinemaInfo(e) {
        const remainingTime = checkCooldown(e.user_id, 'cinema', 'info');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || !userData.cinema) {
            e.reply("你还没有电影院！请先使用 #购买电影院 购买一家电影院。");
            return;
        }

        setCooldown(e.user_id, 'cinema', 'info');
        let data = {
            name: userData.name,
            cinemaName: userData.cinema.name,
            theaters: userData.cinema.theaters,
            movies: userData.cinema.movies,
            facilities: userData.cinema.facilities,
            staff: userData.cinema.staff,
            dailyRevenue: userData.cinema.dailyRevenue,
            totalRevenue: userData.cinema.totalRevenue,
            reputation: userData.cinema.reputation,
            maintenanceCost: userData.cinema.maintenanceCost,
            staffCost: userData.cinema.staffCost
        };
        await this.renderCinemaImage(e, 'cinema_info', data);
    }

    async buyTheater(e) {
        const remainingTime = checkCooldown(e.user_id, 'cinema', 'theater');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || !userData.cinema) {
            e.reply("你还没有电影院！请先使用 #购买电影院 购买一家电影院。");
            return;
        }
        const theaterType = e.msg.replace('#购买影厅', '').trim();
        const { theaters } = loadCinemaConfig();
        
        if (!theaters[theaterType]) {
            e.reply(`无效的影厅类型！可选的影厅类型：${Object.keys(theaters).join('、')}`);
            return;
        }

        // 检查是否已拥有该类型影厅
        if (userData.cinema.theaters.some(t => t.type === theaterType)) {
            e.reply(`你已经拥有${theaters[theaterType].name}了！`);
            return;
        }

        // 检查金钱是否足够
        const theaterCost = theaters[theaterType].cost;
        if (userData.money < theaterCost) {
            e.reply(`你的金钱不足，购买${theaters[theaterType].name}需要${theaterCost}元。`);
            return;
        }

        // 购买影厅
        userData.money -= theaterCost;
        userData.cinema.theaters.push({
            type: theaterType,
            name: `${theaters[theaterType].name}${userData.cinema.theaters.length + 1}`,
            capacity: theaters[theaterType].capacity,
            maintenanceCost: theaters[theaterType].maintenanceCost,
            currentMovie: null,
            schedule: []
        });
        // 更新成本
        userData.cinema.maintenanceCost += theaters[theaterType].maintenanceCost;
        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        setCooldown(e.user_id, 'cinema', 'theater');

        let data = {
            name: userData.name,
            theaterName: `${theaters[theaterType].name}${userData.cinema.theaters.length}`,
            cost: theaterCost,
            money: userData.money,
            capacity: theaters[theaterType].capacity
        };

        await this.renderCinemaImage(e, 'cinema_theater_buy', data);
    }

    async upgradeTheater(e) {
        const remainingTime = checkCooldown(e.user_id, 'cinema', 'upgrade');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || !userData.cinema) {
            e.reply("你还没有电影院！请先使用 #购买电影院 购买一家电影院。");
            return;
        }

        const theaterName = e.msg.replace('#升级影厅', '').trim();
        const theater = userData.cinema.theaters.find(t => t.name === theaterName);
        
        if (!theater) {
            e.reply("未找到指定的影厅！");
            return;
        }

        const { theaters } = loadCinemaConfig();
        const currentTheaterConfig = theaters[theater.type];
        
        if (!currentTheaterConfig.nextLevel) {
            e.reply("该影厅已达到最高等级！");
            return;
        }
        // 检查金钱是否足够
        const upgradeCost = currentTheaterConfig.upgradeCost;
        if (userData.money < upgradeCost) {
            e.reply(`你的金钱不足，升级影厅需要${upgradeCost}元。`);
            return;
        }
        // 升级影厅
        userData.money -= upgradeCost;
        const oldType = theater.type;
        theater.type = currentTheaterConfig.nextLevel;
        theater.capacity = theaters[theater.type].capacity;
        theater.maintenanceCost = theaters[theater.type].maintenanceCost;
        userData.cinema.maintenanceCost -= theaters[oldType].maintenanceCost;
        userData.cinema.maintenanceCost += theaters[theater.type].maintenanceCost;
        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        setCooldown(e.user_id, 'cinema', 'upgrade');

        let data = {
            name: userData.name,
            theaterName: theater.name,
            oldType: theaters[oldType].name,
            newType: theaters[theater.type].name,
            cost: upgradeCost,
            money: userData.money,
            newCapacity: theater.capacity
        };
        await this.renderCinemaImage(e, 'cinema_theater_upgrade', data);
    }

    async buyMovie(e) {
        const remainingTime = checkCooldown(e.user_id, 'cinema', 'movie');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || !userData.cinema) {
            e.reply("你还没有电影院！请先使用 #购买电影院 购买一家电影院。");
            return;
        }

        const movieTitle = e.msg.replace('#购买电影', '').trim();
        const { movies } = loadCinemaConfig();
        
        // 查找电影
        let selectedMovie = null;
        let selectedGenre = '';
        for (const genre in movies) {
            const movie = movies[genre].examples.find(m => m.title === movieTitle);
            if (movie) {
                selectedMovie = movie;
                selectedGenre = genre;
                break;
            }
        }

        if (!selectedMovie) {
            e.reply("未找到该电影！");
            return;
        }
        // 检查是否已拥有该电影
        if (userData.cinema.movies.some(m => m.id === selectedMovie.id)) {
            e.reply("你已经拥有该电影了！");
            return;
        }
        // 检查金钱是否足够
        const movieCost = selectedMovie.cost;
        if (userData.money < movieCost) {
            e.reply(`你的金钱不足，购买电影需要${movieCost}元。`);
            return;
        }

        // 购买电影
        userData.money -= movieCost;
        userData.cinema.movies.push({
            ...selectedMovie,
            purchaseDate: new Date().toISOString()
        });
        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        setCooldown(e.user_id, 'cinema', 'movie');

        let data = {
            name: userData.name,
            movieTitle: selectedMovie.title,
            genre: selectedMovie.genre,
            cost: movieCost,
            money: userData.money,
            rating: selectedMovie.rating,
            popularity: selectedMovie.popularity
        };
        await this.renderCinemaImage(e, 'cinema_movie_buy', data);
    }

    async scheduleMovie(e) {
        const remainingTime = checkCooldown(e.user_id, 'cinema', 'schedule');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }

        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || !userData.cinema) {
            e.reply("你还没有电影院！请先使用 #购买电影院 购买一家电影院。");
            return;
        }
        const args = e.msg.replace('#排片', '').trim().split(' ');
        if (args.length !== 3) {
            e.reply("请按照格式输入：#排片 [影厅名称] [电影名称] [场次时间]");
            return;
        }

        const [theaterName, movieTitle, time] = args;
        const theater = userData.cinema.theaters.find(t => t.name === theaterName);
        const movie = userData.cinema.movies.find(m => m.title === movieTitle);

        if (!theater || !movie) {
            e.reply("未找到指定的影厅或电影！");
            return;
        }
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(time)) {
            e.reply("请输入正确的时间格式（24小时制，如：14:30）");
            return;
        }

        // 检查时间冲突
        const scheduleTime = new Date();
        const [hours, minutes] = time.split(':');
        scheduleTime.setHours(parseInt(hours), parseInt(minutes), 0);

        if (theater.schedule.some(s => {
            const existingTime = new Date(s.time);
            return Math.abs(existingTime - scheduleTime) < movie.duration * 60000;
        })) {
            e.reply("该时间段已有其他电影排片！");
            return;
        }

        // 添加排片
        theater.schedule.push({
            movieId: movie.id,
            movieTitle: movie.title,
            time: time,
            duration: movie.duration,
            price: movie.basePrice
        });

        theater.schedule.sort((a, b) => a.time.localeCompare(b.time));
        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        setCooldown(e.user_id, 'cinema', 'schedule');

        let data = {
            name: userData.name,
            theaterName: theater.name,
            movieTitle: movie.title,
            time: time,
            duration: movie.duration,
            price: movie.basePrice,
            schedule: theater.schedule
        };
        await this.renderCinemaImage(e, 'cinema_schedule', data);
    }

    async buyFacility(e) {
        const remainingTime = checkCooldown(e.user_id, 'cinema', 'facility');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || !userData.cinema) {
            e.reply("你还没有电影院！请先使用 #购买电影院 购买一家电影院。");
            return;
        }
        const facilityType = e.msg.replace('#购买设施', '').trim();
        const { facilities } = loadCinemaConfig();
        if (!facilities[facilityType]) {
            e.reply(`无效的设施类型！可选的设施类型：${Object.keys(facilities).join('、')}`);
            return;
        }
        if (userData.cinema.facilities.some(f => f.type === facilityType)) {
            e.reply(`你已经拥有${facilities[facilityType].name}了！`);
            return;
        }

        // 检查金钱是否足够
        const facilityCost = facilities[facilityType].cost;
        if (userData.money < facilityCost) {
            e.reply(`你的金钱不足，购买${facilities[facilityType].name}需要${facilityCost}元。`);
            return;
        }

        // 购买设施
        userData.money -= facilityCost;
        userData.cinema.facilities.push({
            type: facilityType,
            name: facilities[facilityType].name,
            maintenanceCost: facilities[facilityType].maintenanceCost,
            revenueMultiplier: facilities[facilityType].revenueMultiplier
        });

       
        userData.cinema.maintenanceCost += facilities[facilityType].maintenanceCost;
        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        setCooldown(e.user_id, 'cinema', 'facility');
        let data = {
            name: userData.name,
            facilityName: facilities[facilityType].name,
            cost: facilityCost,
            money: userData.money,
            maintenanceCost: facilities[facilityType].maintenanceCost,
            revenueMultiplier: facilities[facilityType].revenueMultiplier
        };

        await this.renderCinemaImage(e, 'cinema_facility_buy', data);
    }

    async hireStaff(e) {
        const remainingTime = checkCooldown(e.user_id, 'cinema', 'hire');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || !userData.cinema) {
            e.reply("你还没有电影院！请先使用 #购买电影院 购买一家电影院。");
            return;
        }
        const staffType = e.msg.replace('#雇佣员工', '').trim();
        const { staff } = loadCinemaConfig();
        if (!staff[staffType]) {
            e.reply(`无效的员工类型！可选的员工类型：${Object.keys(staff).join('、')}`);
            return;
        }

        // 检查金钱是否足够
        const staffCost = staff[staffType].salary;
        if (userData.money < staffCost) {
            e.reply(`你的金钱不足，雇佣${staff[staffType].name}需要${staffCost}元。`);
            return;
        }

        // 雇佣员工
        userData.money -= staffCost;
        userData.cinema.staff.push({
            type: staffType,
            name: `${staff[staffType].name}${userData.cinema.staff.filter(s => s.type === staffType).length + 1}`,
            level: 1,
            efficiency: staff[staffType].efficiency,
            salary: staff[staffType].salary
        });
        userData.cinema.staffCost += staff[staffType].salary;
        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        setCooldown(e.user_id, 'cinema', 'hire');

        let data = {
            name: userData.name,
            staffName: `${staff[staffType].name}${userData.cinema.staff.filter(s => s.type === staffType).length}`,
            type: staff[staffType].name,
            cost: staffCost,
            money: userData.money,
            level: 1,
            efficiency: staff[staffType].efficiency
        };
        await this.renderCinemaImage(e, 'cinema_staff_hire', data);
    }

    async trainStaff(e) {
        const remainingTime = checkCooldown(e.user_id, 'cinema', 'train');
        if (remainingTime > 0) {
            e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
            return;
        }
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        if (!userData || !userData.cinema) {
            e.reply("你还没有电影院！请先使用 #购买电影院 购买一家电影院。");
            return;
        }

        const args = e.msg.replace('#培训员工', '').trim().split(' ');
        if (args.length !== 2) {
            e.reply("请按照格式输入：#培训员工 [员工名称]");
            return;
        }

        const staffName = args[0];
        const staff = userData.cinema.staff.find(s => s.name === staffName);
        
        if (!staff) {
            e.reply("未找到指定的员工！");
            return;
        }

        const { staff: staffConfig } = loadCinemaConfig();
        const staffTypeConfig = staffConfig[staff.type];

        // 检查是否已达到最高等级
        if (staff.level >= staffTypeConfig.maxLevel) {
            e.reply("该员工已达到最高等级！");
            return;
        }

        // 检查金钱是否足够
        const trainingCost = staffTypeConfig.trainingCost;
        if (userData.money < trainingCost) {
            e.reply(`你的金钱不足，培训员工需要${trainingCost}元。`);
            return;
        }

        // 培训员工
        userData.money -= trainingCost;
        staff.level += 1;
        staff.efficiency = staffTypeConfig.efficiency * (1 + staff.level * 0.1);

        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        setCooldown(e.user_id, 'cinema', 'train');
        let data = {
            name: userData.name,
            staffName: staff.name,
            oldLevel: staff.level - 1,
            newLevel: staff.level,
            cost: trainingCost,
            money: userData.money,
            efficiency: staff.efficiency
        };

        await this.renderCinemaImage(e, 'cinema_staff_train', data);
    }

    async updateCinemaData() {
        const allUsers = await loadAllUsers();
        for (const userId in allUsers) {
            const userData = allUsers[userId];
            if (userData.cinema) {
                // 计算收入
                let dailyRevenue = 0;
                for (const theater of userData.cinema.theaters) {
                    for (const schedule of theater.schedule) {
                        const currentTime = new Date();
                        const scheduleTime = new Date();
                        const [hours, minutes] = schedule.time.split(':');
                        scheduleTime.setHours(parseInt(hours), parseInt(minutes), 0);

                        // 如果当前时间在电影放映时间范围内
                        if (currentTime >= scheduleTime && 
                            currentTime <= new Date(scheduleTime.getTime() + schedule.duration * 60000)) {
                            const movie = userData.cinema.movies.find(m => m.id === schedule.movieId);
                            if (movie) {
                                // 计算上座率
                                const attendanceRate = Math.min(1, movie.popularity / 100 + 
                                    (userData.cinema.reputation - 50) / 100);
                                const viewers = Math.floor(theater.capacity * attendanceRate);
                                
                                // 计算收入
                                const ticketRevenue = viewers * schedule.price;
                                const facilityRevenue = userData.cinema.facilities.reduce((sum, f) => 
                                    sum + viewers * schedule.price * (f.revenueMultiplier - 1), 0);
                                
                                dailyRevenue += ticketRevenue + facilityRevenue;
                                
                                // 更新电影数据
                                movie.revenue += ticketRevenue;
                                movie.viewers += viewers;
                            }
                        }
                    }
                }

                // 更新电影院数据
                userData.cinema.dailyRevenue = dailyRevenue;
                userData.cinema.totalRevenue += dailyRevenue;
                userData.money += dailyRevenue;

                // 扣除维护成本和员工成本
                userData.money -= userData.cinema.maintenanceCost + userData.cinema.staffCost;

                // 更新声望
                const reputationChange = Math.floor((dailyRevenue / 10000) * 0.1);
                userData.cinema.reputation = Math.min(100, 
                    Math.max(0, userData.cinema.reputation + reputationChange));

                await saveUserData(userId, userData);
                await redis.set(`user:${userId}`, JSON.stringify(userData));
            }
        }
    }

    async showCinemaRanking(e) {
        const remainingTime = checkCooldown(e.user_id, 'cinema', 'ranking');
        if (remainingTime > 0) {
            e.reply(`数据处理中，请${remainingTime}秒后再查询～`);
            return;
        }
        const allUsers = await loadAllUsers();
        
        // 筛选出拥有电影院的玩家
        const cinemaUsers = [];
        for (const userId in allUsers) {
            const userData = allUsers[userId];
            if (userData.cinema) {
                cinemaUsers.push({
                    id: userId,
                    name: userData.name,
                    cinemaName: userData.cinema.name,
                    totalRevenue: userData.cinema.totalRevenue,
                    reputation: userData.cinema.reputation,
                    theaters: userData.cinema.theaters.length,
                    movies: userData.cinema.movies.length
                });
            }
        }
        
        if (cinemaUsers.length === 0) {
            e.reply("目前还没有玩家拥有电影院，无法生成排行榜。");
            return;
        }
        
        // 按总收入排序
        cinemaUsers.sort((a, b) => b.totalRevenue - a.totalRevenue);
        const revenueRanking = cinemaUsers.slice(0, 10); // 取前10
        
        // 按声望排序
        const reputationRanking = [...cinemaUsers].sort((a, b) => b.reputation - a.reputation).slice(0, 10);
        
        // 检查当前用户排名
        const userRanking = {
            revenue: cinemaUsers.findIndex(user => user.id === e.user_id) + 1,
            reputation: [...cinemaUsers].sort((a, b) => b.reputation - a.reputation)
                .findIndex(user => user.id === e.user_id) + 1
        };
        
        let data = {
            revenueRanking: revenueRanking,
            reputationRanking: reputationRanking,
            totalCinemas: cinemaUsers.length,
            userRanking: userRanking
        };
        await this.renderCinemaImage(e, 'cinema_ranking', data);
        setCooldown(e.user_id, 'cinema', 'ranking');
    }

    async showCinemaGuide(e) {
        const userId = e.user_id;
        const userData = await checkUserData(userId);
        let data = {
            name: userData ? userData.name : "新玩家",
            hasCinema: userData && userData.cinema,
            commands: [
                { command: "#购买电影院", description: "购买一家电影院，开始你的经营生涯" },
                { command: "#电影院信息", description: "查看你的电影院经营状况" },
                { command: "#购买影厅 [类型]", description: "购买新的影厅，可选：small、medium、large、vip" },
                { command: "#升级影厅 [名称]", description: "升级指定影厅的等级" },
                { command: "#购买电影 [名称]", description: "购买新的电影版权" },
                { command: "#排片 [影厅] [电影] [时间]", description: "为影厅安排电影放映时间" },
                { command: "#购买设施 [类型]", description: "购买新的设施，可选：snackBar、drinkBar、restaurant、giftShop" },
                { command: "#雇佣员工 [类型]", description: "雇佣新的员工，可选：ticketSeller、usher、cleaner、manager" },
                { command: "#培训员工 [名称]", description: "培训指定员工，提升其效率" },
                { command: "#电影院排行榜", description: "查看电影院经营排行榜" }
            ],
            tips: [
                "合理规划影厅数量和类型，满足不同观众需求",
                "及时更新电影片源，保持观众新鲜感",
                "设施和员工的质量会影响收入",
                "注意维护成本和员工成本的控制",
                "声望会影响上座率，要持续提升服务质量",
                "不同时段可以设置不同票价"
            ]
        };
        await this.renderCinemaImage(e, 'cinema_guide', data);
        const guideContent = `# 模拟人生电影院系统攻略

## 基础指令
- **#购买电影院** - 购买一家电影院，开始你的经营生涯
- **#电影院信息** - 查看你的电影院经营状况
- **#购买影厅 [类型]** - 购买新的影厅，可选：small、medium、large、vip
- **#升级影厅 [名称]** - 升级指定影厅的等级
- **#购买电影 [名称]** - 购买新的电影版权
- **#排片 [影厅] [电影] [时间]** - 为影厅安排电影放映时间
- **#购买设施 [类型]** - 购买新的设施，可选：snackBar、drinkBar、restaurant、giftShop
- **#雇佣员工 [类型]** - 雇佣新的员工，可选：ticketSeller、usher、cleaner、manager
- **#培训员工 [名称]** - 培训指定员工，提升其效率
- **#电影院排行榜** - 查看电影院经营排行榜

## 影厅类型
1. **小型影厅**
   - 容量：100人
   - 成本：50万
   - 维护费：1000/小时
   - 可升级为中型影厅

2. **中型影厅**
   - 容量：200人
   - 成本：100万
   - 维护费：2000/小时
   - 可升级为大型影厅

3. **大型影厅**
   - 容量：300人
   - 成本：200万
   - 维护费：3000/小时
   - 可升级为VIP影厅

4. **VIP影厅**
   - 容量：50人
   - 成本：300万
   - 维护费：5000/小时
   - 最高等级

## 设施类型
1. **零食店**
   - 成本：10万
   - 维护费：500/小时
   - 收入倍率：1.2

2. **饮品店**
   - 成本：15万
   - 维护费：800/小时
   - 收入倍率：1.3

3. **餐厅**
   - 成本：30万
   - 维护费：1500/小时
   - 收入倍率：1.5

4. **礼品店**
   - 成本：20万
   - 维护费：1000/小时
   - 收入倍率：1.4

## 员工类型
1. **售票员**
   - 基础工资：3000
   - 培训成本：1000
   - 最高等级：5

2. **引座员**
   - 基础工资：2500
   - 培训成本：800
   - 最高等级：5

3. **清洁工**
   - 基础工资：2000
   - 培训成本：500
   - 最高等级：5

4. **经理**
   - 基础工资：5000
   - 培训成本：2000
   - 最高等级：5

## 电影类型
1. **动作片**
   - 基础票价：50
   - 基础人气：70
   - 时长：120分钟
   - 维护费：1000/小时

2. **喜剧片**
   - 基础票价：45
   - 基础人气：75
   - 时长：100分钟
   - 维护费：800/小时

3. **爱情片**
   - 基础票价：40
   - 基础人气：80
   - 时长：110分钟
   - 维护费：900/小时

## 经营技巧
1. **合理规划影厅**
   - 根据观众需求配置不同大小影厅
   - 考虑升级成本，合理规划升级路线
   - 注意影厅维护成本

2. **电影选择**
   - 及时更新片源，保持新鲜感
   - 根据时段安排不同类型电影
   - 注意电影版权成本

3. **设施配置**
   - 合理配置配套设施
   - 注意设施维护成本
   - 考虑收入倍率

4. **员工管理**
   - 合理配置员工数量
   - 及时培训提升效率
   - 注意工资成本

5. **收入优化**
   - 根据时段调整票价
   - 提升服务质量增加声望
   - 注意成本控制

## 声望系统
- 声望影响上座率
- 通过服务质量提升声望
- 高声望可以获得更多收入
- 注意维护良好声誉

## 排行榜系统
- 按总收入排名
- 按声望排名
- 实时更新数据
- 激励玩家竞争
`;

        const guidePath = path.join(process.cwd(), 'plugins/sims-plugin/doc/电影院攻略.md');
        fs.writeFileSync(guidePath, guideContent, 'utf8');
    }

    async renderCinemaImage(e, template, data) {
        let renderData = {
            quality: 100,
            tplFile: `./plugins/sims-plugin/resources/HTML/${template}.html`,
            ...data
        };

        let img = await puppeteer.screenshot('sims-plugin', renderData);
        e.reply(img);
    }
} 