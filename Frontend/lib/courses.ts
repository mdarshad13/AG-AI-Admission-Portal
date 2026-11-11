export interface CourseItem {
    id: string
    name: string
    code: string
    fee: number
    cutoffEapcet: number
    cutoffEcet: number
}

export const COURSES: CourseItem[] = [
    { id: "cse", name: "Computer Science & Engineering (CSE)", code: "CSE", fee: 125000, cutoffEapcet: 8000, cutoffEcet: 800 },
    { id: "cse-aiml", name: "CSE (Artificial Intelligence & Machine Learning)", code: "CSE-AI&ML", fee: 125000, cutoffEapcet: 10000, cutoffEcet: 1000 },
    { id: "cse-ds", name: "CSE (Data Science)", code: "CSE-DS", fee: 125000, cutoffEapcet: 12000, cutoffEcet: 1200 },
    { id: "it", name: "Information Technology (IT)", code: "IT", fee: 115000, cutoffEapcet: 15000, cutoffEcet: 1500 },
    { id: "ece", name: "Electronics & Communication Engineering (ECE)", code: "ECE", fee: 105000, cutoffEapcet: 25000, cutoffEcet: 2500 },
    { id: "csbs", name: "Computer Science and Business Systems", code: "CSBS", fee: 115000, cutoffEapcet: 18000, cutoffEcet: 1800 },
    { id: "eee", name: "Electrical & Electronics Engineering (EEE)", code: "EEE", fee: 100000, cutoffEapcet: 45000, cutoffEcet: 4500 },
    { id: "mech", name: "Mechanical Engineering (ME)", code: "ME", fee: 95000, cutoffEapcet: 60000, cutoffEcet: 6000 },
    { id: "civil", name: "Civil Engineering (CE)", code: "CE", fee: 95000, cutoffEapcet: 80000, cutoffEcet: 8000 },
]
