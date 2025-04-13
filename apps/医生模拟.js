import { segment } from 'icqq';
import fs from 'fs';
import path from 'path';
import plugin from '../../../lib/plugins/plugin.js';
import puppeteer from '../../../lib/puppeteer/puppeteer.js';
import {
  saveUserData,
  loadAllUsers,
  checkUserData,
  readConfiguration
} from '../function/function.js';
import { checkCooldown, setCooldown } from '../function/cooldown.js';
import Redis from 'ioredis';

const _path = process.cwd().replace(/\\/g, '/');
const redis = new Redis();
const PLUGIN_PATH = path.join(path.resolve(), 'plugins', 'sims-plugin');
const DATA_PATH = path.join(PLUGIN_PATH, 'data', 'doctor');
const cooldownConfig = {
  doctor: {
    base: 5,  // 基础操作冷却时间
    work: 30, // 工作冷却时间
    surgery: 120, // 手术冷却时间
    train: 60, // 培训冷却时间
    research: 180 // 研究冷却时间
  }
};
if (!fs.existsSync(DATA_PATH)) {
  fs.mkdirSync(DATA_PATH, { recursive: true });
}

// 读取疾病数据
const loadDiseases = () => {
  const diseasesPath = path.join(DATA_PATH, 'diseases.json');
  if (fs.existsSync(diseasesPath)) {
    return JSON.parse(fs.readFileSync(diseasesPath, 'utf8'));
  }
  return [];
};

// 读取药品数据
const loadMedicines = () => {
  const medicinesPath = path.join(DATA_PATH, 'medicines.json');
  if (fs.existsSync(medicinesPath)) {
    return JSON.parse(fs.readFileSync(medicinesPath, 'utf8'));
  }
  return [];
};

// 读取手术数据
const loadSurgeries = () => {
  const surgeriesPath = path.join(DATA_PATH, 'surgeries.json');
  if (fs.existsSync(surgeriesPath)) {
    return JSON.parse(fs.readFileSync(surgeriesPath, 'utf8'));
  }
  return [];
};

// 读取设备数据
const loadEquipment = () => {
  const equipmentPath = path.join(DATA_PATH, 'emergency_equipment.json');
  if (fs.existsSync(equipmentPath)) {
    return JSON.parse(fs.readFileSync(equipmentPath, 'utf8'));
  }
  return [];
};

// 读取医疗事件数据
const loadEvents = () => {
  const eventsPath = path.join(DATA_PATH, 'events.json');
  if (fs.existsSync(eventsPath)) {
    return JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
  }
  return [];
};

// 读取医生等级数据
const loadDoctorRanks = () => {
  const ranksPath = path.join(DATA_PATH, 'doctor_ranks.json');
  if (fs.existsSync(ranksPath)) {
    const content = fs.readFileSync(ranksPath, 'utf8');
    try {
      const fixedContent = content.replace(/\\\\/g, '\\')
                                 .replace(/\\:/g, ':')
                                 .replace(/\\{/g, '{')
                                 .replace(/\\}/g, '}');
      return JSON.parse(fixedContent);
    } catch (error) {
      console.error('解析医生等级数据失败:', error);
      return {
        "实习医生": {"level": 1, "salary": 5000},
        "住院医师": {"level": 2, "salary": 8000},
        "主治医师": {"level": 3, "salary": 15000},
        "副主任医师": {"level": 4, "salary": 25000},
        "主任医师": {"level": 5, "salary": 40000}
      };
    }
  }
  return {};
};

// 读取医院等级数据
const loadHospitalLevels = () => {
  const levelsPath = path.join(DATA_PATH, 'hospital_levels.json');
  if (fs.existsSync(levelsPath)) {
    try {
      // 读取文件
      let content = fs.readFileSync(levelsPath, 'utf8');
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      content = content.replace(/^\uFEFF/, '').trim();
      return JSON.parse(content);
    } catch (error) {
      console.error(`[医生模拟]解析医院等级数据失败: ${error.message}`);
      return {
        "level_1": {
          "name": "社区卫生服务中心",
          "description": "基层医疗机构，提供基本医疗服务",
          "upgrade_cost": 50000,
          "max_patients": 50,
          "max_doctors": 10,
          "available_departments": ["全科"],
          "equipment_limit": 10
        }
      };
    }
  }
  return {};
};

// 初始化医生属性
const initDoctorAttributes = () => {
  return {
    rank: "实习医生",
    level: 1,
    experience: 0,
    experienceNeeded: 1000,
    skills: {
      diagnosis: 50,     // 诊断能力
      surgery: 30,       // 手术能力
      prescription: 40,  // 开药能力
      communication: 60, // 沟通能力
      research: 20       // 研究能力
    },
    specialty: null,     // 专科方向
    hospital: {
      name: "社区卫生服务中心",
      level: 1,
      reputation: 50,
      patients: 0,
      maxPatients: 50,
      equipment: [],
      departments: ["全科"],
      staff: 5
    },
    stats: {
      patientsTreated: 0,
      surgeriesPerformed: 0,
      researchCompleted: 0,
      trainingCompleted: 0,
      mistakesMade: 0,
      livesLost: 0,
      livesSaved: 50
    },
    currentPatients: [],
    schedule: [],
    certification: ["基础医疗执照"],
    research: {
      currentProject: null,
      progress: 0,
      publications: 0
    }
  };
};

const getMedicineById = (id) => {
  const medicines = loadMedicines();
  return medicines.find(medicine => medicine.id === id);
};

// 获取手术信息
const getSurgeryById = (id) => {
  const surgeries = loadSurgeries();
  return surgeries.find(surgery => surgery.id === id);
};

// 获取疾病信息
const getDiseaseById = (id) => {
  const diseases = loadDiseases();
  return diseases.find(disease => disease.id === id);
};

// 获取设备信息
const getEquipmentById = (id) => {
  const equipment = loadEquipment();
  return equipment.find(e => e.id === id);
};

// 获取事件信息
const getEventById = (id) => {
  const events = loadEvents();
  return events.find(event => event.id === id);
};

// 生成随机疾病
const getRandomDisease = () => {
  const diseases = loadDiseases();
  const randomIndex = Math.floor(Math.random() * diseases.length);
  return diseases[randomIndex];
};

// 生成随机患者
const generatePatient = () => {
  const names = ["张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十", 
                "郑一", "王二", "陈三", "林四", "黄五", "刘六", "吴七", "徐八"];
  const ages = [5, 12, 18, 24, 32, 45, 56, 67, 78, 85];
  const genders = ["男", "女"];
  
  const randomName = names[Math.floor(Math.random() * names.length)];
  const randomAge = ages[Math.floor(Math.random() * ages.length)];
  const randomGender = genders[Math.floor(Math.random() * genders.length)];
  const disease = getRandomDisease();
  
  return {
    id: Date.now().toString(),
    name: randomName,
    age: randomAge,
    gender: randomGender,
    disease: disease,
    condition: Math.random() > 0.7 ? "危重" : (Math.random() > 0.4 ? "重症" : "轻症"),
    admissionTime: new Date().toISOString(),
    treatment: {
      medicines: [],
      surgery: null,
      diagnosis: null,
      notes: []
    },
    satisfaction: 70 + Math.floor(Math.random() * 20)
  };
};
// 计算手术成功率
const calculateSurgerySuccessRate = (doctor, surgery, patient) => {
  let baseRate = surgery.success_rate / 100;  // 基础成功率
  
  // 医生技能加成
  baseRate += (doctor.skills.surgery - 50) / 100;
  
  // 等级要求影响
  if (doctor.level < surgery.required_level) {
    baseRate -= 0.2 * (surgery.required_level - doctor.level);
  }
  
  // 患者状况影响
  if (patient.condition === "危重") {
    baseRate -= 0.15;
  } else if (patient.condition === "重症") {
    baseRate -= 0.05;
  }
  
  // 医院设备影响
  const requiredEquipment = surgery.required_equipment || [];
  const doctorEquipment = doctor.hospital.equipment.map(e => e.id);
  const hasAllEquipment = requiredEquipment.every(id => doctorEquipment.includes(id));
  
  if (!hasAllEquipment) {
    baseRate -= 0.2;
  }
  
  // 确保概率在合理范围内
  return Math.max(0.05, Math.min(0.95, baseRate));
};

// 计算用药有效性
const calculateMedicineEffectiveness = (doctor, medicine, disease) => {
  let effectiveness = medicine.effectiveness / 100;  // 基础有效性
  
  // 医生技能加成
  effectiveness += (doctor.skills.prescription - 50) / 200;
  
  // 药物适用性
  const isDiseaseMatch = medicine.application.some(app => 
    disease.symptoms.includes(app) || disease.name.includes(app));
  
  if (isDiseaseMatch) {
    effectiveness += 0.2;
  } else {
    effectiveness -= 0.3;
  }
  
  // 确保在合理范围内
  return Math.max(0.1, Math.min(0.95, effectiveness));
};

// 获取医生等级信息
const getDoctorRankInfo = (rank) => {
  const ranks = loadDoctorRanks();
  return ranks[rank] || null;
};

// 检查升级条件
const checkLevelUp = (doctorData) => {
  if (doctorData.experience >= doctorData.experienceNeeded) {
    const ranks = Object.keys(loadDoctorRanks());
    const currentRankIndex = ranks.indexOf(doctorData.rank);
    
    if (currentRankIndex < ranks.length - 1) {
      doctorData.rank = ranks[currentRankIndex + 1];
      doctorData.level = getDoctorRankInfo(doctorData.rank).level;
      doctorData.experience = 0;
      doctorData.experienceNeeded = doctorData.level * 1000;
      return true;
    }
  }
  return false;
};

// 计算声誉变化
const calculateReputationChange = (outcome, eventImpact) => {
  const impactMap = {
    perfect: 1.5,
    good: 1.0,
    average: 0.5,
    bad: -1.0,
    terrible: -2.0
  };
  
  return eventImpact * (impactMap[outcome] || 0);
};

// 处理医生事件
const processDoctorEvent = (doctor, eventId) => {
  const event = getEventById(eventId);
  if (!event) return null;
  
  // 计算成功率
  let successRate = 0.5;  // 基础成功率
  successRate += (doctor.level / 10);  // 等级影响
  
  // 根据事件成功因素计算
  const factors = event.success_rate_factors;
  if (factors) {
    if (factors.doctor_level) {
      successRate += factors.doctor_level * (doctor.level / 5);
    }
    
    if (factors.equipment_quality) {
      // 计算医院设备质量
      const equipmentQuality = doctor.hospital.equipment.length / 20;  // 简化计算
      successRate += factors.equipment_quality * equipmentQuality;
    }
    
    if (factors.team_support) {
      // 计算团队支持
      const teamSupport = doctor.hospital.staff / 50;  // 简化计算
      successRate += factors.team_support * teamSupport;
    }
  }
  
  // 根据事件难度调整
  successRate -= event.difficulty * 0.03;
  const random = Math.random();
  let outcome;
  
  if (random > 0.95) {
    outcome = "terrible";
  } else if (random > 0.8) {
    outcome = "bad";
  } else if (random > 0.6) {
    outcome = "average";
  } else if (random > 0.2) {
    outcome = "good";
  } else {
    outcome = "perfect";
  }
  
  // 根据成功率调整结果
  if (successRate > 0.8 && outcome === "terrible") {
    outcome = "bad";
  } else if (successRate < 0.2 && outcome === "perfect") {
    outcome = "good";
  }
  
  // 计算经验获得
  const experienceGain = event.difficulty * 50 * (outcome === "perfect" ? 2 : 
                                                outcome === "good" ? 1.5 : 
                                                outcome === "average" ? 1 : 
                                                outcome === "bad" ? 0.5 : 0.2);
  
  const reputationChange = calculateReputationChange(outcome, event.reputation_impact);
  
  return {
    event,
    outcome,
    outcomeDescription: event.outcomes[outcome],
    reward: Math.round(event.reward * (outcome === "perfect" ? 1.5 : 
                                      outcome === "good" ? 1.2 : 
                                      outcome === "average" ? 1 : 
                                      outcome === "bad" ? 0.6 : 0.3)),
    experienceGain: Math.round(experienceGain),
    reputationChange
  };
};

// 更新技能点
const updateSkill = (doctor, skillName, increment) => {
  if (doctor.skills[skillName] !== undefined) {
    doctor.skills[skillName] = Math.min(100, doctor.skills[skillName] + increment);
  }
};
const getSkillRating = (value) => {
  if (value >= 90) return "专家级";
  if (value >= 80) return "精通";
  if (value >= 70) return "熟练";
  if (value >= 60) return "良好";
  if (value >= 50) return "一般";
  if (value >= 40) return "初级";
  if (value >= 30) return "基础";
  return "新手";
};
const formatMoney = (amount) => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
async function image(e, file, obj) {
    let data = {
        quality: 100,
        tplFile: `./plugins/sims-plugin/resources/HTML/${file}.html`,
        ...obj,
    }
    let img = await puppeteer.screenshot('sims-plugin', {
        ...data,
    })
   
    e.reply([img])
}

export class DoctorSimulation extends plugin {
  constructor() {
    super({
      name: '医生模拟',
      dsc: '模拟人生医生职业系统',
      event: 'message',
      priority: 600,
      rule: [
        { reg: '^#医生就职$', fnc: 'startDoctorCareer' },
        { reg: '^#医生信息$', fnc: 'showDoctorInfo' },
        { reg: '^#医院信息$', fnc: 'showHospitalInfo' },
        { reg: '^#接诊患者$', fnc: 'receivePatient' },
        { reg: '^#诊断.*$', fnc: 'diagnosisPatient' },
        { reg: '^#开药.*$', fnc: 'prescribeMedicine' },
        { reg: '^#查看患者$', fnc: 'viewPatients' },
        { reg: '^#查看药品$', fnc: 'viewMedicines' },
        { reg: '^#查看手术$', fnc: 'viewSurgeries' },
        { reg: '^#查看设备$', fnc: 'viewEquipment' },
        { reg: '^#购买设备.*$', fnc: 'buyEquipment' },
        { reg: '^#进行手术.*$', fnc: 'performSurgery' },
        { reg: '^#医生培训.*$', fnc: 'doctorTraining' },
        { reg: '^#医学研究.*$', fnc: 'medicalResearch' },
        { reg: '^#处理医疗事件$', fnc: 'handleMedicalEvent' },
        { reg: '^#升级医院$', fnc: 'upgradeHospital' },
        { reg: '^#专科方向.*$', fnc: 'setSpecialty' },
        { reg: '^#医生帮助$', fnc: 'showDoctorHelp' }
      ]
    });
  }

  async startDoctorCareer(e) {
    
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'base');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
      return;
    }

    const userId = e.user_id;
    const userData = await checkUserData(userId);
    if (!userData) {
      e.reply("请先使用 #开始模拟人生 来创建角色！");
      return;
    }

    if (userData.doctor) {
      e.reply("你已经是一名医生了！");
      return;
    }

    userData.doctor = initDoctorAttributes();
    await saveUserData(userId, userData);
    await redis.set(`user:${userId}`, JSON.stringify(userData));

    setCooldown(e.user_id, 'doctor', 'base');
    const doctorData = userData.doctor;
    
    image(e, 'doctor_join', {
      hospital_name: doctorData.hospital.name,
      hospital_level: doctorData.hospital.level,
      hospital_reputation: doctorData.hospital.reputation,
      hospital_departments: doctorData.hospital.departments.join(', '),
      diagnosis_skill: doctorData.skills.diagnosis,
      diagnosis_rating: getSkillRating(doctorData.skills.diagnosis),
      surgery_skill: doctorData.skills.surgery,
      surgery_rating: getSkillRating(doctorData.skills.surgery),
      prescription_skill: doctorData.skills.prescription,
      prescription_rating: getSkillRating(doctorData.skills.prescription),
      communication_skill: doctorData.skills.communication,
      communication_rating: getSkillRating(doctorData.skills.communication),
      research_skill: doctorData.skills.research,
      research_rating: getSkillRating(doctorData.skills.research)
    });
  }

  async showDoctorInfo(e) {
    
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'base');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
      return;
    }

    const userId = e.user_id;
    const userData = await checkUserData(userId);
    if (!userData || !userData.doctor) {
      e.reply("你还不是医生！请先使用 #医生就职 开始医生职业。");
      return;
    }

    
    setCooldown(e.user_id, 'doctor', 'base');

    const doctorData = userData.doctor;
    const expPercentage = Math.floor((doctorData.experience / doctorData.experienceNeeded) * 100);
    
    image(e, 'doctor_info', {
      user_name: userData.name,
      doctor_rank: doctorData.rank,
      doctor_level: doctorData.level,
      doctor_specialty: doctorData.specialty || "暂无专科方向",
      doctor_experience: doctorData.experience,
      doctor_experience_needed: doctorData.experienceNeeded,
      exp_percentage: expPercentage,
      diagnosis_skill: doctorData.skills.diagnosis,
      diagnosis_rating: getSkillRating(doctorData.skills.diagnosis),
      surgery_skill: doctorData.skills.surgery,
      surgery_rating: getSkillRating(doctorData.skills.surgery),
      prescription_skill: doctorData.skills.prescription,
      prescription_rating: getSkillRating(doctorData.skills.prescription),
      communication_skill: doctorData.skills.communication,
      communication_rating: getSkillRating(doctorData.skills.communication),
      research_skill: doctorData.skills.research,
      research_rating: getSkillRating(doctorData.skills.research),
      patients_treated: doctorData.stats.patientsTreated,
      surgeries_performed: doctorData.stats.surgeriesPerformed,
      research_completed: doctorData.stats.researchCompleted,
      lives_saved: doctorData.stats.livesSaved,
      mistakes_made: doctorData.stats.mistakesMade,
      publications: doctorData.research.publications
    });
  }
  
  async showHospitalInfo(e) {
    
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'base');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
      return;
    }

    const userId = e.user_id;
    const userData = await checkUserData(userId);
    if (!userData || !userData.doctor) {
      e.reply("你还不是医生！请先使用 #医生就职 开始医生职业。");
      return;
    }

    
    setCooldown(e.user_id, 'doctor', 'base');

    const hospital = userData.doctor.hospital;
    const hospitalLevels = loadHospitalLevels();
    const nextLevel = hospitalLevels[`level_${hospital.level + 1}`];
    
    const hospitalEquipment = hospital.equipment.map(equip => {
              const equipment = getEquipmentById(equip.id);
      return equipment ? {
        name: equipment.name,
        rating: getSkillRating(equipment.effectiveness)
      } : null;
    }).filter(item => item !== null);
    
    const hasNextLevel = !!nextLevel;
    const departmentsStr = hospital.departments.join(', ');
    
    image(e, 'hospital_info', {
      hospital_name: hospital.name,
      hospital_level: hospital.level,
      hospital_reputation: hospital.reputation,
      hospital_patients: hospital.patients,
      hospital_max_patients: hospital.maxPatients,
      hospital_staff: hospital.staff,
      departments_str: departmentsStr,
      equipment_count: hospital.equipment.length,
      hospital_equipment: hospitalEquipment,
      current_patients_count: userData.doctor.currentPatients.length,
      total_patients_treated: userData.doctor.stats.patientsTreated,
      has_next_level: hasNextLevel,
      next_level_name: hasNextLevel ? nextLevel.name : "",
      next_level: hasNextLevel ? hospital.level + 1 : "",
      upgrade_cost: hasNextLevel ? formatMoney(nextLevel.upgrade_cost) : "",
      next_level_max_patients: hasNextLevel ? nextLevel.max_patients : "",
      next_level_departments: hasNextLevel ? nextLevel.available_departments.join(', ') : ""
    });
  }

  async receivePatient(e) {
    
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'work');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
      return;
    }

    const userId = e.user_id;
    const userData = await checkUserData(userId);
    if (!userData || !userData.doctor) {
      e.reply("你还不是医生！请先使用 #医生就职 开始医生职业。");
      return;
    }

    const doctorData = userData.doctor;
    
    // 检查当前患者数量
    if (doctorData.currentPatients.length >= 5) {
      e.reply("你当前接诊的患者已达上限，请先处理现有患者！");
      return;
    }
    
    // 检查医院容量
    if (doctorData.hospital.patients >= doctorData.hospital.maxPatients) {
      e.reply("医院已经人满为患，无法接收更多病人！请考虑升级医院。");
      return;
    }

    const newPatient = generatePatient();
    doctorData.currentPatients.push(newPatient);
    doctorData.hospital.patients++;
    
    await saveUserData(userId, userData);
    await redis.set(`user:${userId}`, JSON.stringify(userData));

    setCooldown(e.user_id, 'doctor', 'work');
    const diseaseName = newPatient.disease ? newPatient.disease.name : "未知疾病";
    const symptoms = newPatient.disease ? newPatient.disease.symptoms.join(", ") : "症状不明";
    const conditionColor = 
              newPatient.condition === "危重" ? "#e74c3c" : 
      newPatient.condition === "重症" ? "#f39c12" : "#2ecc71";
    image(e, 'new_patient', {
      patient_name: newPatient.name,
      patient_gender: newPatient.gender,
      patient_gender_emoji: newPatient.gender === "男" ? "👨" : "👩",
      patient_age: newPatient.age,
      patient_condition: newPatient.condition,
      condition_color: conditionColor,
      patient_id: newPatient.id,
      patient_symptoms: symptoms
    });
  }

  // 查看当前患者
  async viewPatients(e) {
    
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'base');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
      return;
    }

    const userId = e.user_id;
    const userData = await checkUserData(userId);
    if (!userData || !userData.doctor) {
      e.reply("你还不是医生！请先使用 #医生就职 开始医生职业。");
      return;
    }

    const doctorData = userData.doctor;
    
    // 检查是否有患者
    if (doctorData.currentPatients.length === 0) {
      e.reply("你当前没有接诊的患者，可以使用 #接诊患者 命令接诊新患者。");
      return;
    }

    
    setCooldown(e.user_id, 'doctor', 'base');
    const patients = doctorData.currentPatients.map(patient => {
      let diagnosisName = "未诊断";
      if (patient.treatment && patient.treatment.diagnosis) {
        const diagnosedDisease = getDiseaseById(patient.treatment.diagnosis.disease);
        diagnosisName = diagnosedDisease ? diagnosedDisease.name : "未知疾病";
      }
      const conditionColor = 
        patient.condition === "危重" ? "#e74c3c" : 
        patient.condition === "重症" ? "#f39c12" : "#2ecc71";
      
      // 设置诊断标签样式
      const diagnosisBgColor = patient.treatment && patient.treatment.diagnosis ? "#d5f5e3" : "#f5d5d5";
      const diagnosisTextColor = patient.treatment && patient.treatment.diagnosis ? "#27ae60" : "#c0392b";
      
      // 检查是否有药物和手术
      const hasMedicines = patient.treatment && patient.treatment.medicines && patient.treatment.medicines.length > 0;
      const hasSurgery = patient.treatment && !!patient.treatment.surgery;
      const medicinesList = [];
      if (hasMedicines) {
        patient.treatment.medicines.forEach(med => {
          if (typeof med === 'object') {
            medicinesList.push({
              name: med.name || '未知药物',
              effectiveness: med.effectiveness || 0
            });
          } else {
            const medicineInfo = getMedicineById(med);
            if (medicineInfo) {
              medicinesList.push({
                name: medicineInfo.name,
                effectiveness: medicineInfo.effectiveness || 0
              });
            }
          }
        });
      }
      
      // 准备手术数据
      let surgeryName = "";
      let surgeryResult = "";
      if (hasSurgery) {
        const surgeryInfo = getSurgeryById(patient.treatment.surgery.id);
        surgeryName = surgeryInfo ? surgeryInfo.name : "未知手术";
        surgeryResult = patient.treatment.surgery.result || "待进行";
      }
      
      // 确保notes是数组且正确格式化
      const hasNotes = patient.treatment && patient.treatment.notes && patient.treatment.notes.length > 0;
      const notesList = hasNotes ? 
        patient.treatment.notes.map(note => {
          return typeof note === 'object' ? note : { content: note };
        }) : [];
      
      // 构建患者对象，确保所有必要字段都存在
      return {
        id: patient.id || '',
        name: patient.name || '未知患者',
        gender: patient.gender || '',
        age: patient.age || 0,
        condition: patient.condition || '未知',
        condition_color: conditionColor,
        admission_time: patient.admissionTime ? new Date(patient.admissionTime).toLocaleString() : '未知时间',
        satisfaction: patient.satisfaction || 0,
        diagnosis_status: patient.treatment && patient.treatment.diagnosis ? "已诊断" : "未诊断",
        diagnosis_bg_color: diagnosisBgColor,
        diagnosis_text_color: diagnosisTextColor,
        diagnosis_name: diagnosisName,
        has_medicines: hasMedicines,
        no_medicines: !hasMedicines,
        medicines: medicinesList,
        has_surgery: hasSurgery,
        no_surgery: !hasSurgery,
        surgery_name: surgeryName,
        surgery_result: surgeryResult,
        has_notes: hasNotes,
        notes: notesList
      };
    });
    image(e, 'patients_list', {
      patients_count: patients.length,
      patients: patients
    });
  }
  async viewMedicines(e) {
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'base');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
      return;
    }

    const userId = e.user_id;
    const userData = await checkUserData(userId);
    if (!userData || !userData.doctor) {
      e.reply("你还不是医生！请先使用 #医生就职 开始医生职业。");
      return;
    }
    setCooldown(e.user_id, 'doctor', 'base');

    try {
      const medicines = loadMedicines();
      const processedMedicines = medicines.map(medicine => {
        let effectivenessColor;
        let effectivenessClass;
        let medicineColorClass;
        
        if (medicine.effectiveness >= 80) {
          effectivenessColor = "#2ecc71"; // 绿色
          effectivenessClass = "high";
          medicineColorClass = "medicine-item-green";
        } else if (medicine.effectiveness >= 60) {
          effectivenessColor = "#f39c12"; // 橙色
          effectivenessClass = "medium";
          medicineColorClass = "medicine-item-orange";
        } else {
          effectivenessColor = "#e74c3c"; // 红色
          effectivenessClass = "low";
          medicineColorClass = "medicine-item-red";
        }
        

        let applicationStr = "暂无记录";
        if (medicine.application && Array.isArray(medicine.application) && medicine.application.length > 0) {
          applicationStr = medicine.application.join('、');
        }
        return {
          id: medicine.id,
          name: medicine.name || "未知药品",
          type: medicine.type || "未分类",
          description: medicine.description || "暂无描述",
          effect: medicine.effect || "暂无功效记录",
          side_effects: medicine.side_effects || "暂无副作用记录",
          effectiveness: medicine.effectiveness || 0,
          price: medicine.price || 0,
          effectiveness_color: effectivenessColor,
          effectiveness_class: effectivenessClass,
          medicine_color_class: medicineColorClass,
          application: applicationStr
        };
      });
      
     // console.log(`[医生模拟][viewMedicines] 渲染药品列表，共${medicines.length}种药品`);
      
     let cssFile = `${_path}/plugins/sims-plugin/resources/`
      image(e, 'medicines_list', {
        medicines_count: medicines.length,
        cssFile,
        medicines: processedMedicines
      });
    } catch (error) {
      console.error(`[医生模拟][viewMedicines]错误: ${error.message}`);
      e.reply("查看药品时发生错误，请稍后再试");
    }
  }
  async viewSurgeries(e) {
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'base');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
      return;
    }

    const userId = e.user_id;
    const userData = await checkUserData(userId);
    if (!userData || !userData.doctor) {
      e.reply("你还不是医生！请先使用 #医生就职 开始医生职业。");
      return;
    }
    setCooldown(e.user_id, 'doctor', 'base');
    const surgeries = loadSurgeries();
    const doctorData = userData.doctor;
    const surgeriesData = surgeries.map(surgery => {
      const difficultyColor = 
        surgery.difficulty >= 8 ? "#e74c3c" : 
        surgery.difficulty >= 5 ? "#f39c12" : "#2ecc71";
      const successRateColor = 
        surgery.success_rate >= 90 ? "#2ecc71" : 
        surgery.success_rate >= 75 ? "#f39c12" : "#e74c3c";
      const isEligible = doctorData.level >= surgery.required_level;
      const eligibleColor = isEligible ? "#2ecc71" : "#e74c3c";
      const eligibleText = isEligible ? "可执行" : "等级不足";
      const eligibleBgColor = isEligible ? "#d5f5e3" : "#f5d5d5";
      const requiredEquipment = surgery.required_equipment || [];
      const doctorEquipment = doctorData.hospital.equipment.map(e => e.id);
      const hasAllEquipment = requiredEquipment.every(id => doctorEquipment.includes(id));
      const equipment_info = surgery.required_equipment.map(equipId => {
        const equipment = getEquipmentById(equipId);
        const hasEquipment = doctorEquipment.includes(equipId);
        const style = hasEquipment ? 
          "background-color: #d5f5e3; border: 1px solid #2ecc71;" : 
          "background-color: #f5d5d5; border: 1px solid #e74c3c;";
        
        return {
          name: equipment ? equipment.name : "未知设备",
          style,
          hasEquipment
        };
      });
      
      return {
        ...surgery,
        difficultyColor,
        successRateColor,
        eligibleColor,
        eligibleText,
        eligibleBgColor,
        hasAllEquipment,
        equipment_info,
        price_formatted: formatMoney(surgery.price)
      };
    });
    image(e, 'surgeries_list', {
      surgeries: surgeriesData,
      surgeries_length: surgeries.length,
      doctorData
    });
  }

  async viewEquipment(e) {
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'base');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
      return;
    }

    const userId = e.user_id;
    const userData = await checkUserData(userId);
    if (!userData || !userData.doctor) {
      e.reply("你还不是医生！请先使用 #医生就职 开始医生职业。");
      return;
    }
    setCooldown(e.user_id, 'doctor', 'base');
    const allEquipment = loadEquipment();
    const doctorData = userData.doctor;
    const ownedEquipmentIds = doctorData.hospital.equipment.map(e => e.id);
    const equipmentList = allEquipment.map(equipment => {
  
      const isOwned = ownedEquipmentIds.includes(equipment.id);
      const ownedStyle = isOwned ? 
        "background-color: #2ecc71;" : 
        "background-color: #7f8c8d;";
      const ownedText = isOwned ? "已拥有" : "未拥有";
      const effectivenessColor = 
        equipment.effectiveness >= 90 ? "#2ecc71" : 
        equipment.effectiveness >= 70 ? "#f39c12" : "#e74c3c";
      const isEligible = doctorData.level >= equipment.required_level;
      const canAfford = userData.money >= equipment.price;
  
      let eligibleText = "";
      let eligibleColor = "";
      let eligibleBgColor = "";
      
      if (isEligible) {
        if (canAfford) {
          eligibleText = "可购买";
          eligibleColor = "#2ecc71";
          eligibleBgColor = "#d5f5e3";
        } else {
          eligibleText = "资金不足";
          eligibleColor = "#e74c3c";
          eligibleBgColor = "#f5d5d5";
        }
      } else {
        eligibleText = "等级不足";
        eligibleColor = "#e74c3c";
        eligibleBgColor = "#f5d5d5";
      }
      
      return {
        ...equipment,
        isOwned,
        ownedStyle,
        ownedText,
        effectivenessColor,
        isEligible,
        canAfford,
        eligibleText,
        eligibleColor,
        eligibleBgColor,
        price_formatted: formatMoney(equipment.price),
        maintenance_cost_formatted: formatMoney(equipment.maintenance_cost)
      };
    });
   
    image(e, 'equipment_list', {
      equipmentList,
      ownedCount: ownedEquipmentIds.length,
      maxCapacity: doctorData.hospital.level * 10,
      userMoney: formatMoney(userData.money)
    });
  }

 
  async buyEquipment(e) {
    
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'base');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
      return;
    }

    const userId = e.user_id;
    const userData = await checkUserData(userId);
    if (!userData || !userData.doctor) {
      e.reply("你还不是医生！请先使用 #医生就职 开始医生职业。");
      return;
    }
    const match = /^#购买设备\s*(\S+)/.exec(e.msg);
    if (!match) {
      e.reply("请使用正确格式：#购买设备 [设备ID]");
      return;
    }

    const equipmentId = match[1];
    const equipment = getEquipmentById(equipmentId);
    
    if (!equipment) {
      e.reply("未找到该设备，请使用 #查看设备 查看可用设备列表。");
      return;
    }
    if (userData.doctor.level < equipment.required_level) {
      e.reply(`你的医生等级不足，需要${equipment.required_level}级才能购买${equipment.name}。`);
      return;
    }
    if (userData.money < equipment.price) {
      e.reply(`资金不足，购买${equipment.name}需要${formatMoney(equipment.price)}元。`);
      return;
    }
    const maxEquipment = userData.doctor.hospital.level * 10;
    if (userData.doctor.hospital.equipment.length >= maxEquipment) {
      e.reply(`医院设备容量已满（${maxEquipment}/${maxEquipment}），请升级医院以获得更多设备位。`);
      return;
    }
    if (userData.doctor.hospital.equipment.some(e => e.id === equipmentId)) {
      e.reply(`你的医院已经拥有${equipment.name}了！`);
      return;
    }

    userData.money -= equipment.price;
    userData.doctor.hospital.equipment.push({
      id: equipmentId,
      purchaseDate: new Date().toISOString(),
      condition: 100
    });
    await saveUserData(userId, userData);
    await redis.set(`user:${userId}`, JSON.stringify(userData));

    setCooldown(e.user_id, 'doctor', 'base');
    image(e, 'equipment_purchase', {
      equipment_name: equipment.name,
      equipment_description: equipment.description,
      equipment_type: equipment.type,
      equipment_price: formatMoney(equipment.price),
      equipment_effectiveness: equipment.effectiveness,
      effectiveness_rating: getSkillRating(equipment.effectiveness),
      hospital_equipment_count: userData.doctor.hospital.equipment.length,
      hospital_max_equipment: maxEquipment,
      user_money: formatMoney(userData.money)
    });
  }
  async performSurgery(e) {
    
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'surgery');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${Math.ceil(remainingTime / 60)}分钟后再试～`);
      return;
    }

    const userId = e.user_id;
    const userData = await checkUserData(userId);
    if (!userData || !userData.doctor) {
      e.reply("你还不是医生！请先使用 #医生就职 开始医生职业。");
      return;
    }
    const match = /^#进行手术\s*(\S+)\s*(\S+)/.exec(e.msg);
    if (!match) {
      e.reply("请使用正确格式：#进行手术 [手术ID] [患者ID]");
      return;
    }

    const surgeryId = match[1];
    const patientId = match[2];
    const surgery = getSurgeryById(surgeryId);
    if (!surgery) {
      e.reply("未找到该手术，请使用 #查看手术 查看可用手术列表。");
      return;
    }
    const patientIndex = userData.doctor.currentPatients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) {
      e.reply("未找到该患者，请使用 #查看患者 查看当前患者列表。");
      return;
    }
    
    const patient = userData.doctor.currentPatients[patientIndex];
    if (userData.doctor.level < surgery.required_level) {
      e.reply(`你的医生等级不足，需要${surgery.required_level}级才能进行${surgery.name}。`);
      return;
    }

    const requiredEquipment = surgery.required_equipment || [];
    const doctorEquipment = userData.doctor.hospital.equipment.map(e => e.id);
    const missingEquipment = [];
    
    for (const equipId of requiredEquipment) {
      if (!doctorEquipment.includes(equipId)) {
        const equipment = getEquipmentById(equipId);
        missingEquipment.push(equipment ? equipment.name : `ID:${equipId}`);
      }
    }
    
    if (missingEquipment.length > 0) {
      e.reply(`缺少必要设备：${missingEquipment.join('、')}，无法进行${surgery.name}。`);
      return;
    }

    // 计算手术成功率
    const successRate = calculateSurgerySuccessRate(userData.doctor, surgery, patient);
    const isSuccess = Math.random() < successRate;
    
    // 手术结果
    let result;
    let experienceGain;
    let reputationChange;
    
    if (isSuccess) {
      result = Math.random() > 0.7 ? "非常成功" : "成功";
      experienceGain = surgery.difficulty * 100;
      reputationChange = surgery.difficulty * 2;
      
      // 更新患者状况
      if (patient.condition === "危重") {
        patient.condition = "重症";
      } else if (patient.condition === "重症") {
        patient.condition = "轻症";
      } else if (patient.condition === "轻症") {
        // 移除患者（治愈）
        userData.doctor.currentPatients.splice(patientIndex, 1);
        userData.doctor.stats.livesSaved++;
        userData.doctor.hospital.patients--;
      }
      updateSkill(userData.doctor, "surgery", surgery.difficulty / 2);
    } else {
      result = Math.random() > 0.5 ? "失败" : "严重失败";
      experienceGain = surgery.difficulty * 20;
      reputationChange = -surgery.difficulty * 3;
      
      // 更新患者状况（恶化）
      if (Math.random() > 0.6) {
        if (patient.condition === "轻症") {
          patient.condition = "重症";
        } else if (patient.condition === "重症") {
          patient.condition = "危重";
        } else if (patient.condition === "危重" && Math.random() > 0.7) {
          // 患者死亡
          userData.doctor.currentPatients.splice(patientIndex, 1);
          userData.doctor.stats.livesLost++;
          userData.doctor.stats.mistakesMade++;
          userData.doctor.hospital.patients--;
          result = "患者死亡";
          reputationChange = -surgery.difficulty * 5;
        }
      }
      
      // 更新技能（失败了也有一点提升）
      updateSkill(userData.doctor, "surgery", surgery.difficulty / 5);
    }
    
    // 更新患者手术记录
    if (patientIndex >= 0 && patientIndex < userData.doctor.currentPatients.length) {
      if (!userData.doctor.currentPatients[patientIndex].treatment) {
        userData.doctor.currentPatients[patientIndex].treatment = {};
      }
      
      userData.doctor.currentPatients[patientIndex].treatment.surgery = {
        id: surgeryId,
        name: surgery.name,
        result: result,
        performedAt: new Date().toISOString()
      };
      
      // 更新患者满意度
      if (isSuccess) {
        userData.doctor.currentPatients[patientIndex].satisfaction += 10;
      } else {
        userData.doctor.currentPatients[patientIndex].satisfaction -= 20;
      }
      userData.doctor.currentPatients[patientIndex].satisfaction = 
        Math.max(0, Math.min(100, userData.doctor.currentPatients[patientIndex].satisfaction));
    }
    userData.doctor.experience += experienceGain;
    userData.doctor.hospital.reputation = Math.max(0, Math.min(100, userData.doctor.hospital.reputation + reputationChange));
    userData.doctor.stats.surgeriesPerformed++;
    
    const hasLeveledUp = checkLevelUp(userData.doctor);
    await saveUserData(userId, userData);
    await redis.set(`user:${userId}`, JSON.stringify(userData));
    
    
    setCooldown(e.user_id, 'doctor', 'surgery');
    image(e, 'surgery_result', {
      surgery_name: surgery.name,
      surgery_difficulty: surgery.difficulty,
      patient_name: patient.name,
      patient_condition: patientIndex >= 0 && patientIndex < userData.doctor.currentPatients.length ? 
                        userData.doctor.currentPatients[patientIndex].condition : 
                        (result === "患者死亡" ? "死亡" : "治愈"),
      result: result,
      success_rate: Math.round(successRate * 100),
      experience_gain: experienceGain,
      reputation_change: reputationChange,
      level_up: hasLeveledUp,
      new_rank: hasLeveledUp ? userData.doctor.rank : null,
      total_surgeries: userData.doctor.stats.surgeriesPerformed,
      surgery_skill: userData.doctor.skills.surgery,
      surgery_rating: getSkillRating(userData.doctor.skills.surgery)
    });
  }
  async doctorTraining(e) {
    
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'train');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${Math.ceil(remainingTime / 60)}分钟后再试～`);
      return;
    }

    const userId = e.user_id;
    const userData = await checkUserData(userId);
    if (!userData || !userData.doctor) {
      e.reply("你还不是医生！请先使用 #医生就职 开始医生职业。");
      return;
    }
    const match = /^#医生培训\s*(\S+)/.exec(e.msg);
    if (!match) {
      image(e, 'training_options', {
        doctor_level: userData.doctor.level,
        doctor_rank: userData.doctor.rank,
        diagnosis_skill: userData.doctor.skills.diagnosis,
        diagnosis_rating: getSkillRating(userData.doctor.skills.diagnosis),
        surgery_skill: userData.doctor.skills.surgery,
        surgery_rating: getSkillRating(userData.doctor.skills.surgery),
        prescription_skill: userData.doctor.skills.prescription,
        prescription_rating: getSkillRating(userData.doctor.skills.prescription),
        communication_skill: userData.doctor.skills.communication,
        communication_rating: getSkillRating(userData.doctor.skills.communication),
        research_skill: userData.doctor.skills.research,
        research_rating: getSkillRating(userData.doctor.skills.research),
        user_money: formatMoney(userData.money)
      });
      return;
    }
    const trainingType = match[1];
    const trainingCost = 500 * userData.doctor.level;
    if (userData.money < trainingCost) {
      e.reply(`资金不足，进行培训需要${formatMoney(trainingCost)}元。`);
      return;
    }
    const validSkills = ["诊断", "手术", "开药", "沟通", "研究"];
    const skillMap = {
      "诊断": "diagnosis",
      "手术": "surgery",
      "开药": "prescription",
      "沟通": "communication",
      "研究": "research"
    };
    
    if (!validSkills.includes(trainingType)) {
      e.reply(`无效的培训类型，请选择：${validSkills.join('、')}`);
      return;
    }
    
    const skillKey = skillMap[trainingType];
    if (userData.doctor.skills[skillKey] >= 100) {
      e.reply(`你的${trainingType}技能已经达到最高级别！`);
      return;
    }
    userData.money -= trainingCost;
    const currentSkill = userData.doctor.skills[skillKey];
    let skillGain;
    
    if (currentSkill < 50) {
      skillGain = 5 + Math.floor(Math.random() * 6); // 5-10
    } else if (currentSkill < 70) {
      skillGain = 3 + Math.floor(Math.random() * 5); // 3-7
    } else if (currentSkill < 90) {
      skillGain = 2 + Math.floor(Math.random() * 3); // 2-4
    } else {
      skillGain = 1 + Math.floor(Math.random() * 2); // 1-2
    }
    const oldSkill = userData.doctor.skills[skillKey];
    updateSkill(userData.doctor, skillKey, skillGain);
    const expGain = skillGain * 100;
    userData.doctor.experience += expGain;
    userData.doctor.stats.trainingCompleted++;
    const hasLeveledUp = checkLevelUp(userData.doctor);
    await saveUserData(userId, userData);
    await redis.set(`user:${userId}`, JSON.stringify(userData));
    setCooldown(e.user_id, 'doctor', 'train');
    image(e, 'training_result', {
      training_type: trainingType,
      training_cost: formatMoney(trainingCost),
      skill_old: oldSkill,
      skill_new: userData.doctor.skills[skillKey],
      skill_gain: skillGain,
      skill_rating_old: getSkillRating(oldSkill),
      skill_rating_new: getSkillRating(userData.doctor.skills[skillKey]),
      experience_gain: expGain,
      level_up: hasLeveledUp,
      new_rank: hasLeveledUp ? userData.doctor.rank : null,
      total_trainings: userData.doctor.stats.trainingCompleted,
      user_money: formatMoney(userData.money)
    });
  }

  async medicalResearch(e) {
    
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'research');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${Math.ceil(remainingTime / 60)}分钟后再试～`);
      return;
    }

    const userId = e.user_id;
    const userData = await checkUserData(userId);
    if (!userData || !userData.doctor) {
      e.reply("你还不是医生！请先使用 #医生就职 开始医生职业。");
      return;
    }

    const match = /^#医学研究\s*(\S+)?/.exec(e.msg);
    const action = match && match[1] ? match[1] : "查看";
    
    if (userData.doctor.skills.research < 30) {
      e.reply("你的研究能力不足，需要至少30点研究技能才能开展医学研究。");
      return;
    }
    const researchCostBase = 2000 * userData.doctor.level;
    
    if (action === "查看") {
      if (!userData.doctor.research.currentProject) {
        e.reply("你当前没有进行中的研究项目，请使用 #医学研究 开始 [领域] 来开始一个新项目。");
        return;
      }
      
      image(e, 'research_status', {
        project_name: userData.doctor.research.currentProject.name,
        project_field: userData.doctor.research.currentProject.field,
        project_description: userData.doctor.research.currentProject.description,
        progress: userData.doctor.research.progress,
        progress_percentage: Math.floor(userData.doctor.research.progress / userData.doctor.research.currentProject.requiredProgress * 100),
        required_progress: userData.doctor.research.currentProject.requiredProgress,
        research_skill: userData.doctor.skills.research,
        research_rating: getSkillRating(userData.doctor.skills.research),
        expected_reward: formatMoney(userData.doctor.research.currentProject.reward),
        publications: userData.doctor.research.publications
      });
      return;
    } else if (action === "开始") {
      if (userData.doctor.research.currentProject) {
        e.reply("你已经有一个进行中的研究项目，请先完成当前项目或使用 #医学研究 放弃 来终止它。");
        return;
      }
      const fieldMatch = /^#医学研究\s*开始\s*(\S+)/.exec(e.msg);
      if (!fieldMatch) {
        e.reply("请使用正确格式：#医学研究 开始 [领域]，可选领域：疾病治疗、药物研发、手术技术、医学器械、疾病预防");
        return;
      }
      
      const field = fieldMatch[1];
      const validFields = ["疾病治疗", "药物研发", "手术技术", "医学器械", "疾病预防"];
      
      if (!validFields.includes(field)) {
        e.reply(`无效的研究领域，请选择：${validFields.join('、')}`);
        return;
      }
      if (userData.money < researchCostBase) {
        e.reply(`资金不足，开展研究需要${formatMoney(researchCostBase)}元。`);
        return;
      }
      userData.money -= researchCostBase;
      
      const projectNames = {
        "疾病治疗": ["慢性病治疗方案优化", "罕见病诊疗指南", "癌症治疗新方法"],
        "药物研发": ["新型抗生素研究", "慢性病药物副作用减轻", "新一代疫苗研发"],
        "手术技术": ["微创手术新技术", "器官移植优化方案", "神经外科精准手术"],
        "医学器械": ["便携式诊断设备", "生命体征监测新设备", "康复辅助设备"],
        "疾病预防": ["传染病预防新方案", "生活方式干预研究", "遗传病筛查技术"]
      };
      
      const randomName = projectNames[field][Math.floor(Math.random() * projectNames[field].length)];
      const difficultyFactor = 1 + (Math.random() * 0.5);
      const requiredProgress = Math.floor(100 * difficultyFactor * (1 + userData.doctor.level / 10));
      const reward = Math.floor(researchCostBase * 1.5 * difficultyFactor);
      
      userData.doctor.research.currentProject = {
        name: randomName,
        field: field,
        description: `这是一项关于${field}领域的${randomName}研究，预计完成后将获得显著成果。`,
        startDate: new Date().toISOString(),
        requiredProgress: requiredProgress,
        difficulty: difficultyFactor,
        reward: reward
      };
      
      userData.doctor.research.progress = 0;
      
      
      await saveUserData(userId, userData);
      await redis.set(`user:${userId}`, JSON.stringify(userData));

      image(e, 'research_start', {
        project_name: randomName,
        project_field: field,
        research_cost: formatMoney(researchCostBase),
        required_progress: requiredProgress,
        expected_reward: formatMoney(reward),
        research_skill: userData.doctor.skills.research,
        research_rating: getSkillRating(userData.doctor.skills.research),
        user_money: formatMoney(userData.money)
      });
      return;
    } else if (action === "进展") {
  
      if (!userData.doctor.research.currentProject) {
        e.reply("你当前没有进行中的研究项目，请使用 #医学研究 开始 [领域] 来开始一个新项目。");
        return;
      }
      setCooldown(e.user_id, 'doctor', 'research');
      
      const baseProgress = 5 + Math.floor(Math.random() * 10);
      const skillBonus = Math.floor(userData.doctor.skills.research / 10);
      const totalProgress = baseProgress + skillBonus;
      userData.doctor.research.progress += totalProgress;
      
      updateSkill(userData.doctor, "research", 1 + Math.floor(Math.random() * 2));
      const isCompleted = userData.doctor.research.progress >= userData.doctor.research.currentProject.requiredProgress;
      
      if (isCompleted) {
        const reward = userData.doctor.research.currentProject.reward;
        userData.money += reward;
        const experienceGain = 500 * userData.doctor.level;
        userData.doctor.experience += experienceGain;
        
        userData.doctor.research.publications++;
        userData.doctor.stats.researchCompleted++;
        const completedProject = userData.doctor.research.currentProject;
        userData.doctor.research.currentProject = null;
        userData.doctor.research.progress = 0;
        const hasLeveledUp = checkLevelUp(userData.doctor);
        
        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        

        image(e, 'research_complete', {
          project_name: completedProject.name,
          project_field: completedProject.field,
          reward: formatMoney(reward),
          experience_gain: experienceGain,
          level_up: hasLeveledUp,
          new_rank: hasLeveledUp ? userData.doctor.rank : null,
          publications: userData.doctor.research.publications,
          research_skill: userData.doctor.skills.research,
          research_rating: getSkillRating(userData.doctor.skills.research),
          user_money: formatMoney(userData.money)
        });
      } else {
        
        await saveUserData(userId, userData);
        await redis.set(`user:${userId}`, JSON.stringify(userData));
        image(e, 'research_progress', {
          project_name: userData.doctor.research.currentProject.name,
          progress_gain: totalProgress,
          current_progress: userData.doctor.research.progress,
          progress_percentage: Math.floor(userData.doctor.research.progress / userData.doctor.research.currentProject.requiredProgress * 100),
          required_progress: userData.doctor.research.currentProject.requiredProgress,
          research_skill: userData.doctor.skills.research,
          research_rating: getSkillRating(userData.doctor.skills.research)
        });
      }
      return;
    } else if (action === "放弃") {
      if (!userData.doctor.research.currentProject) {
        e.reply("你当前没有进行中的研究项目。");
        return;
      }
      
      const abandonedProject = userData.doctor.research.currentProject;
      userData.doctor.research.currentProject = null;
      userData.doctor.research.progress = 0;
      await saveUserData(userId, userData);
      await redis.set(`user:${userId}`, JSON.stringify(userData));
      setCooldown(e.user_id, 'doctor', 'base');
      
      image(e, 'research_abandon', {
        project_name: abandonedProject.name,
        project_field: abandonedProject.field,
        current_progress: userData.doctor.research.progress,
        progress_percentage: Math.floor(userData.doctor.research.progress / abandonedProject.requiredProgress * 100),
        required_progress: abandonedProject.requiredProgress
      });
      return;
    } else {
      e.reply("无效的研究命令，可用命令：查看、开始、进展、放弃");
      return;
    }
  }

  async handleMedicalEvent(e) {
    
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'work');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
      return;
    }

    const userId = e.user_id;
    const userData = await checkUserData(userId);
    if (!userData || !userData.doctor) {
      e.reply("你还不是医生！请先使用 #医生就职 开始医生职业。");
      return;
    }
    
    setCooldown(e.user_id, 'doctor', 'work');
    const events = loadEvents();
    const eligibleEvents = events.filter(event => 
      event.min_level <= userData.doctor.level && 
      event.max_level >= userData.doctor.level
    );
    
    if (eligibleEvents.length === 0) {
      e.reply("目前没有适合你处理的医疗事件。");
      return;
    }
    const randomEvent = eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
    const eventResult = processDoctorEvent(userData.doctor, randomEvent.id);
    
    if (!eventResult) {
      e.reply("处理事件时出现错误，请稍后再试。");
      return;
    }
    userData.money += eventResult.reward;
    userData.doctor.experience += eventResult.experienceGain;
    userData.doctor.hospital.reputation = Math.max(0, Math.min(100, 
      userData.doctor.hospital.reputation + eventResult.reputationChange));
    const hasLeveledUp = checkLevelUp(userData.doctor);
    
    await saveUserData(userId, userData);
    await redis.set(`user:${userId}`, JSON.stringify(userData));
    
    image(e, 'medical_event', {
      event_name: eventResult.event.name,
      event_description: eventResult.event.description,
      event_difficulty: eventResult.event.difficulty,
      outcome: eventResult.outcome,
      outcome_description: eventResult.outcomeDescription,
      reward: formatMoney(eventResult.reward),
      experience_gain: eventResult.experienceGain,
      reputation_change: eventResult.reputationChange.toFixed(1),
      level_up: hasLeveledUp,
      new_rank: hasLeveledUp ? userData.doctor.rank : null,
      hospital_reputation: userData.doctor.hospital.reputation,
      user_money: formatMoney(userData.money)
    });
  }

  async upgradeHospital(e) {
    
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'base');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
      return;
    }

    const userId = e.user_id;
    const userData = await checkUserData(userId);
    if (!userData || !userData.doctor) {
      e.reply("你还不是医生！请先使用 #医生就职 开始医生职业。");
      return;
    }
    
    // 获取医院等级数据
    const hospitalLevels = loadHospitalLevels();
    const currentLevel = userData.doctor.hospital.level;
    const nextLevelKey = `level_${currentLevel + 1}`;
    
    if (!hospitalLevels[nextLevelKey]) {
      e.reply("你的医院已经达到最高等级，无法继续升级！");
      return;
    }
    
    const nextLevel = hospitalLevels[nextLevelKey];
    
    // 检查医生等级要求
    if (userData.doctor.level < Math.ceil((currentLevel + 1) / 2)) {
      e.reply(`医生等级不足，升级医院至${nextLevel.name}需要医生达到${Math.ceil((currentLevel + 1) / 2)}级。`);
      return;
    }
    
    // 检查资金
    if (userData.money < nextLevel.upgrade_cost) {
      e.reply(`资金不足，升级医院至${nextLevel.name}需要${formatMoney(nextLevel.upgrade_cost)}元。`);
      return;
    }
    userData.money -= nextLevel.upgrade_cost;
    const oldHospital = { ...userData.doctor.hospital };
    
    userData.doctor.hospital.name = nextLevel.name;
    userData.doctor.hospital.level = currentLevel + 1;
    userData.doctor.hospital.maxPatients = nextLevel.max_patients;
    
    // 添加新科室
    for (const dept of nextLevel.available_departments) {
      if (!userData.doctor.hospital.departments.includes(dept)) {
        userData.doctor.hospital.departments.push(dept);
      }
    }
    
    // 更新医院声誉
    userData.doctor.hospital.reputation += 10;
    userData.doctor.hospital.reputation = Math.min(100, userData.doctor.hospital.reputation);
    userData.doctor.hospital.staff += 5;
    
    // 给予经验奖励
    const expGain = 500 * currentLevel;
    userData.doctor.experience += expGain;
    const hasLeveledUp = checkLevelUp(userData.doctor);
    
    await saveUserData(userId, userData);
    await redis.set(`user:${userId}`, JSON.stringify(userData));
    
    setCooldown(e.user_id, 'doctor', 'base');
    
    image(e, 'hospital_upgrade', {
      old_name: oldHospital.name,
      old_level: oldHospital.level,
      new_name: userData.doctor.hospital.name,
      new_level: userData.doctor.hospital.level,
      upgrade_cost: formatMoney(nextLevel.upgrade_cost),
      old_max_patients: oldHospital.maxPatients,
      new_max_patients: userData.doctor.hospital.maxPatients,
      old_departments: oldHospital.departments.join(', '),
      new_departments: userData.doctor.hospital.departments.join(', '),
      reputation: userData.doctor.hospital.reputation,
      experience_gain: expGain,
      level_up: hasLeveledUp,
      new_rank: hasLeveledUp ? userData.doctor.rank : null,
      user_money: formatMoney(userData.money)
    });
  }

  async setSpecialty(e) {
    
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'base');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
      return;
    }

    const userId = e.user_id;
    const userData = await checkUserData(userId);
    if (!userData || !userData.doctor) {
      e.reply("你还不是医生！请先使用 #医生就职 开始医生职业。");
      return;
    }
    const match = /^#专科方向\s*(\S+)/.exec(e.msg);
    if (!match) {
      const availableDepartments = userData.doctor.hospital.departments;
      
      image(e, 'specialty_options', {
        doctor_name: userData.name,
        doctor_rank: userData.doctor.rank,
        current_specialty: userData.doctor.specialty || "暂无专科方向",
        available_departments: availableDepartments,
        doctor_level: userData.doctor.level,
        diagnosis_skill: userData.doctor.skills.diagnosis,
        surgery_skill: userData.doctor.skills.surgery,
        prescription_skill: userData.doctor.skills.prescription
      });
      return;
    }

    const specialty = match[1];
    if (!userData.doctor.hospital.departments.includes(specialty)) {
      e.reply(`你的医院目前没有【${specialty}】科室，请先升级医院或选择现有科室作为专科方向。`);
      return;
    }

    if (userData.doctor.level < 2) {
      e.reply("你需要达到住院医师(2级)才能选择专科方向！");
      return;
    }
    const oldSpecialty = userData.doctor.specialty;
    userData.doctor.specialty = specialty;
    const skillBoosts = {
      "外科": "surgery",
      "内科": "diagnosis",
      "儿科": "communication",
      "神经科": "diagnosis",
      "心血管科": "surgery",
      "肿瘤科": "research",
      "急诊科": "diagnosis",
      "妇产科": "surgery",
      "精神科": "communication",
      "全科": "prescription"
    };
    if (skillBoosts[specialty]) {
      updateSkill(userData.doctor, skillBoosts[specialty], 3);
    }
    await saveUserData(userId, userData);
    await redis.set(`user:${userId}`, JSON.stringify(userData));
    
    setCooldown(e.user_id, 'doctor', 'base');
    
    image(e, 'specialty_set', {
      doctor_name: userData.name,
      doctor_rank: userData.doctor.rank,
      old_specialty: oldSpecialty || "无专科",
      new_specialty: specialty,
      specialty_icon: getSpecialtyIcon(specialty),
      specialty_description: getSpecialtyDescription(specialty),
      boosted_skill: skillBoosts[specialty] ? getSkillName(skillBoosts[specialty]) : "全面能力",
      boosted_skill_value: skillBoosts[specialty] ? userData.doctor.skills[skillBoosts[specialty]] : "",
      boosted_skill_rating: skillBoosts[specialty] ? getSkillRating(userData.doctor.skills[skillBoosts[specialty]]) : "",
      doctor_level: userData.doctor.level,
      hospital_name: userData.doctor.hospital.name
    });
  }

  async showDoctorHelp(e) {
    
    const remainingTime = checkCooldown(e.user_id, 'doctor', 'base');
    if (remainingTime > 0) {
      e.reply(`操作太快啦，请等待${remainingTime}秒后再试～`);
      return;
    }
    
    
    setCooldown(e.user_id, 'doctor', 'base');
    
    const helpCategories = [
      {
        title: "👨‍⚕️ 基础命令",
        icon: "stethoscope",
        commands: [
          { name: "#医生就职", description: "开始医生职业生涯" },
          { name: "#医生信息", description: "查看你的医生详细信息" },
          { name: "#医院信息", description: "查看你的医院详细信息" },
          { name: "#医生帮助", description: "显示医生模拟系统帮助" }
        ]
      },
      {
        title: "🏥 医院管理",
        icon: "hospital",
        commands: [
          { name: "#升级医院", description: "将医院升级到更高级别" },
          { name: "#专科方向 [科室]", description: "设置医生专科方向" },
          { name: "#查看设备", description: "查看可购买的医疗设备" },
          { name: "#购买设备 [设备ID]", description: "购买医疗设备" }
        ]
      },
      {
        title: "👩‍⚕️ 患者管理",
        icon: "patient",
        commands: [
          { name: "#接诊患者", description: "接待新的患者" },
          { name: "#查看患者", description: "查看当前所有患者" },
          { name: "#诊断 [患者ID] [疾病ID]", description: "诊断患者的疾病" },
          { name: "#开药 [患者ID] [药品ID]", description: "为患者开具药物" }
        ]
      },
      {
        title: "🔬 医疗活动",
        icon: "medical",
        commands: [
          { name: "#进行手术 [手术ID] [患者ID]", description: "为患者进行手术" },
          { name: "#查看手术", description: "查看可执行的手术列表" },
          { name: "#查看药品", description: "查看可开具的药品列表" },
          { name: "#处理医疗事件", description: "处理随机医疗事件" }
        ]
      },
      {
        title: "📚 学习与研究",
        icon: "research",
        commands: [
          { name: "#医生培训 [技能]", description: "培训提升医生技能" },
          { name: "#医学研究 开始 [领域]", description: "开始新的医学研究" },
          { name: "#医学研究 进展", description: "推进当前研究进度" },
          { name: "#医学研究 查看", description: "查看当前研究状态" }
        ]
      }
    ];
   
    const cooldowns = [
      { action: "基础操作", time: `${cooldownConfig.doctor.base}秒` },
      { action: "接诊/医疗事件", time: `${cooldownConfig.doctor.work}秒` },
      { action: "手术", time: `${cooldownConfig.doctor.surgery}秒(${Math.floor(cooldownConfig.doctor.surgery/60)}分钟)` },
      { action: "培训", time: `${cooldownConfig.doctor.train}秒(${Math.floor(cooldownConfig.doctor.train/60)}分钟)` },
      { action: "研究", time: `${cooldownConfig.doctor.research}秒(${Math.floor(cooldownConfig.doctor.research/60)}分钟)` }
    ];
    
    const userId = e.user_id;
    const userData = await checkUserData(userId);
    const hasDoctor = userData && userData.doctor;
    image(e, 'doctor_help', {
      help_categories: helpCategories,
      cooldowns: cooldowns,
      user_name: userData ? userData.name : "旅行者",
      has_doctor: hasDoctor,
      doctor_rank: hasDoctor ? userData.doctor.rank : "",
      doctor_level: hasDoctor ? userData.doctor.level : "",
      hospital_name: hasDoctor ? userData.doctor.hospital.name : "",
      hospital_level: hasDoctor ? userData.doctor.hospital.level : "",
      specialty: hasDoctor ? (userData.doctor.specialty || "暂无专科") : "",
      patients_count: hasDoctor ? userData.doctor.currentPatients.length : 0
    });
  }
}
function getSpecialtyIcon(specialty) {
  const icons = {
    "外科": "🔪",
    "内科": "💊",
    "儿科": "👶",
    "神经科": "🧠",
    "心血管科": "❤️",
    "肿瘤科": "🔬",
    "急诊科": "🚑",
    "妇产科": "👪",
    "精神科": "🧿",
    "全科": "👨‍⚕️"
  };
  
  return icons[specialty] || "🏥";
}
function getSpecialtyDescription(specialty) {
  const descriptions = {
    "外科": "专注于通过外科手术治疗疾病，手术成功率更高。",
    "内科": "专注于内科疾病的诊断和治疗，诊断准确率更高。",
    "儿科": "专注于儿童疾病的诊断和治疗，沟通能力提升。",
    "神经科": "专注于神经系统疾病，诊断复杂疾病的能力提升。",
    "心血管科": "专注于心脏和血管疾病，手术和诊断能力双提升。",
    "肿瘤科": "专注于肿瘤的研究和治疗，研究能力大幅提升。",
    "急诊科": "专注于急危重症的快速诊断和处理，应对突发事件能力增强。",
    "妇产科": "专注于女性健康和生育相关的医疗，特殊手术能力提升。",
    "精神科": "专注于心理和精神疾病，沟通和诊断能力提升。",
    "全科": "全面发展各项医疗技能，开药能力提升。"
  };
  
  return descriptions[specialty] || "专注于特定领域的医疗实践";
}

// 获取技能名称
function getSkillName(skillKey) {
  const skillNames = {
    "diagnosis": "诊断能力",
    "surgery": "手术能力",
    "prescription": "开药能力",
    "communication": "沟通能力",
    "research": "研究能力"
  };
  
  return skillNames[skillKey] || skillKey;
}
