import { segment } from 'icqq';
import fs from 'fs';
import path from 'path';
import plugin from '../../../lib/plugins/plugin.js';
import { saveUserData, loadAllUsers, checkUserData } from '../function/function.js';

// 电影院影片信息和其他数据存储路径
const PLUGIN_PATH = path.join(path.resolve(), 'plugins', 'sims-plugin');
const MOVIE_STORE_FILE_PATH = path.join(PLUGIN_PATH,'data', 'movie_store.json');

const LANGUAGES = {
    en: "English",
    zh: "中文"
};//我差点忘了这是文游，所以这个没什么用处，先留着吧

const SEAT_COUNT = 25; // 假设每场电影有25个座位
const SEAT_STATUS = {}; // 用于管理座位状态

export class Cinema extends plugin {
    constructor() {
        super({
            name: 'Cinema',
            dsc: '模拟电影院',
            event: 'message',
            priority: 600,
            rule: [
                { reg: '^#影院信息$', fnc: 'showMovies' },
                { reg: '^#购票 (.+)$', fnc: 'buyTicket' },
                { reg: '^#影评 (.+)$', fnc: 'leaveReview' },
                { reg: '^#查看影评$', fnc: 'showReviews' },
                { reg: '^#选座 (\\d+)$', fnc: 'selectSeat' },
                { reg: '^#我的购票记录$', fnc: 'showBookingHistory' },
                { reg: '^#推荐电影$', fnc: 'recommendMovies' },
                { reg: '^#设置语言 (en|zh)$', fnc: 'setLanguage' },
                { reg: '^#搜索电影 (.+)$', fnc: 'searchMovies' },
                { reg: '^#观看电影 (.+)$', fnc: 'watchMovie' },
                { reg: '^#活动信息$', fnc: 'showEvents' },
                { reg: '^#虚拟现实观影 (.+)$', fnc: 'watchVRMovie' }
            ],
        });
        this.initializeSeatStatus(); // 初始化座位状态
    }

    // 初始化座位状态
    initializeSeatStatus() {
        for (let i = 1; i <= SEAT_COUNT; i++) {
            SEAT_STATUS[i] = true; // 所有座位初始为可用
        }
    }

    async showMovies(e) {
        try {
            const movies = JSON.parse(fs.readFileSync(MOVIE_STORE_FILE_PATH));
            const movieList = movies.map(m => 
                `名称: ${m.name}, 类型: ${m.type}, 评分: ${m.rating}, 价格: ${m.price}元`
            ).join("\n");
            e.reply(`当前播放的电影:\n${movieList}`);
        } catch (error) {
            e.reply("读取电影信息失败，请稍后再试。");
            console.error(error);
        }
    }

    async buyTicket(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const message = e.msg.replace('#购票', '').trim();
        const movieName = message.split(' ')[0];
        const userSeat = message.split(' ')[1];
        const showTime = message.split(' ')[2];

        try {
            const movies = JSON.parse(fs.readFileSync(MOVIE_STORE_FILE_PATH));
            const movie = movies.find(m => m.name === movieName);

            if (!user) {
                e.reply("请先开始模拟人生！");
                return;
            }
            if (!movie) {
                e.reply("该电影不存在，请查看影院信息。");
                return;
            }
            if (user.money < movie.price) {
                e.reply("你的资金不足，无法购买该电影的票。");
                return;
            }
            if (!SEAT_STATUS[userSeat]) {
                e.reply("所选座位已被占用，请选择其他座位。");
                return;
            }

            if (!user.bookingHistory) {
                user.bookingHistory = [];
            }

            user.money -= movie.price;
            user.bookingHistory.push({ 
                movie: movie.name, 
                seat: userSeat, 
                price: movie.price, 
                showTime: showTime 
            });
            
            // 更新座位状态为已占用
            SEAT_STATUS[userSeat] = false;

            await saveUserData(userId, user);
            e.reply(`成功购买电影票: ${movie.name}, 座位: ${userSeat}，价格: ${movie.price}元，时间: ${showTime}。`);
        } catch (error) {
            e.reply("购票失败，请稍后再试。");
            console.error(error);
        }
    }

    async leaveReview(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const reviewMessage = e.msg.replace('#影评', '').trim();

        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }

        if (!user.reviews) {
            user.reviews = [];
        }

        user.reviews.push(reviewMessage);
        await saveUserData(userId, user);
        e.reply("谢谢你的影评！");
    }

    async showReviews(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);

        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }

        if (!user.reviews || user.reviews.length === 0) {
            e.reply("你还没有留下影评。");
            return;
        }

        const reviewList = user.reviews.map((review, index) => `影评${index + 1}: ${review}`).join("\n");
        e.reply(`你的影评如下:\n${reviewList}`);
    }

    async selectSeat(e) {
        const userId = e.user_id;
        const seatNumber = e.msg.replace('#选座', '').trim();
        const user = await checkUserData(userId);

        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }

        if (!SEAT_STATUS[seatNumber]) {
            e.reply("该座位已被占用，请选择其他座位。");
            return;
        }

        e.reply(`你已选择座位: ${seatNumber}`);
    }

    async showBookingHistory(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);

        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }

        if (!user.bookingHistory || user.bookingHistory.length === 0) {
            e.reply("你还没有购票记录。");
            return;
        }

        const bookingList = user.bookingHistory.map((booking, index) => 
            `电影: ${booking.movie}, 座位: ${booking.seat}, 价格: ${booking.price}元, 时间: ${booking.showTime}`
        ).join("\n");
        e.reply(`你的购票记录如下:\n${bookingList}`);
    }

    async recommendMovies(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);

        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }

        // 高级推荐逻辑（基于评分和用户历史行为）
        const recommendedMovies = [];
        const movies = JSON.parse(fs.readFileSync(MOVIE_STORE_FILE_PATH));

        movies.forEach(movie => {
            if (movie.rating > 4.0) {  // 假设推荐评分高的电影
                recommendedMovies.push(movie.name);
            }
        });

        if (recommendedMovies.length === 0) {
            e.reply("没有推荐的电影。");
        } else {
            e.reply(`推荐的电影有:\n${recommendedMovies.join(", ")}`);
        }
    }

    async setLanguage(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const lang = e.msg.replace('#设置语言', '').trim();

        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }

        if (LANGUAGES[lang]) {
            user.language = lang;
            await saveUserData(userId, user);
            e.reply(`你的语言设置为: ${LANGUAGES[lang]}`);
        } else {
            e.reply("不支持该语言，请选择 'en' 或 'zh'。");
        }
    }

    async searchMovies(e) {
        const userId = e.user_id;
        const query = e.msg.replace('#搜索电影', '').trim().toLowerCase();
        const movies = JSON.parse(fs.readFileSync(MOVIE_STORE_FILE_PATH));
        const results = movies.filter(movie => 
            movie.name.toLowerCase().includes(query) || movie.type.toLowerCase().includes(query)
        );

        if (results.length === 0) {
            e.reply("没有找到相关电影。");
            return;
        }

        const resultList = results.map(m => 
            `名称: ${m.name}, 类型: ${m.type}, 评分: ${m.rating}, 价格: ${m.price}元`
        ).join("\n");
        e.reply(`搜索结果:\n${resultList}`);
    }

    async watchMovie(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const movieName = e.msg.replace('#观看电影', '').trim();

        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }

        const movies = JSON.parse(fs.readFileSync(MOVIE_STORE_FILE_PATH));
        const movie = user.bookingHistory.find(h => h.movie === movieName);

        if (!movie) {
            e.reply("你没有票或票已过期，无法观看此电影。");
            return;
        }

        // 增加家庭关系的逻辑
        if (user.partner) {
            user.partnerAffection += 10;  // 假设观看电影增加10点好感
            user.mood += 5;  // 假设观影后增加双方心情
            await saveUserData(userId, user);
            e.reply(`你和 ${user.partner} 一起观看电影: ${movieName}，对方的好感度增加，并且你们的心情得到了提升！`);
        } else {
            e.reply(`你观看电影: ${movieName}，享受愉快的时光！`);
        }
    }

    async showEvents(e) {
       
        const events = [
            "春节活动: 电影票买一赠一！",
            "夏季特惠: 全天候8折优惠！",
            "冬季节日: 收集票根可免费兑换周边商品！"
        ];
        e.reply(`当前活动信息:\n${events.join("\n")}`);
    }

    async watchVRMovie(e) {
        const userId = e.user_id;
        const user = await checkUserData(userId);
        const movieName = e.msg.replace('#虚拟现实观影', '').trim();

        if (!user) {
            e.reply("请先开始模拟人生！");
            return;
        }

        // 这里假设用户需要提前购买VR电影的票
        const movies = JSON.parse(fs.readFileSync(MOVIE_STORE_FILE_PATH));
        const movie = movies.find(m => m.name === movieName);

        if (!movie) {
            e.reply("该VR电影不存在，请查看影院信息。");
            return;
        }

        e.reply(`你正在以 VR 方式观看电影: ${movie.name}，沉浸式体验开始！`);
    }
}
