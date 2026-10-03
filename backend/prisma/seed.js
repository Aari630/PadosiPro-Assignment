"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
var catalogue = [
    {
        category: 'Home & Maintenance',
        slug: 'home-maintenance',
        tasks: [
            { name: 'Appliance Servicing', description: 'Schedule AC, refrigerator, or washing machine deep maintenance.' },
            { name: 'Plumbing Repairs', description: 'Fix leaking taps, pipelines, or pressure valve adjustments.' },
            { name: 'Deep Home Cleaning', description: 'Comprehensive sanitization and cleaning for all rooms.' },
            { name: 'Electrician On-Demand', description: 'Wiring inspections, socket installs, and fuse maintenance.' },
            { name: 'Carpentry Adjustments', description: 'Door hinge fixes, furniture assembling, and wood polishing.' },
        ],
    },
    {
        category: 'Errands & Logistics',
        slug: 'errands-logistics',
        tasks: [
            { name: 'Document Pickup & Courier', description: 'Secure parcel pickup and dispatch via express courier.' },
            { name: 'Grocery & Market Runs', description: 'Personal shopping from local specialty and organic markets.' },
            { name: 'Pharmacy Purchases', description: 'Prescription drop-off and medicine delivery.' },
            { name: 'Dry Cleaning Concierge', description: 'Pickup, professional dry clean handling, and timely drop-off.' },
            { name: 'Vehicle Servicing Drop', description: 'Drive your car or two-wheeler to authorized service centers.' },
        ],
    },
    {
        category: 'Personal & Lifestyle',
        slug: 'personal-lifestyle',
        tasks: [
            { name: 'Pet Care & Walking', description: 'Daily dog walking and vet visit accompaniment.' },
            { name: 'Plant & Garden Upkeep', description: 'Pruning, organic fertilizing, and scheduled watering.' },
            { name: 'Event & Party Support', description: 'Arranging catering staff, setup, and cleanup logistics.' },
            { name: 'Elderly Assistance', description: 'Friendly accompaniment for regular walks, banking, or doctor visits.' },
            { name: 'Fitness Trainer Scheduling', description: 'Curating certified yoga and fitness trainers for home sessions.' },
        ],
    },
    {
        category: 'Admin & Household Management',
        slug: 'admin-household',
        tasks: [
            { name: 'Utility Bill Automation', description: 'Auditing and consolidating electricity, water, and broadband dues.' },
            { name: 'Domestic Staff Sourcing', description: 'Background checks and sourcing for maids, cooks, and drivers.' },
            { name: 'Key & Access Management', description: 'Secure coordination of keys for guest or technician entry.' },
            { name: 'Inventory Replenishment', description: 'Restocking household pantry staples on a set bi-weekly schedule.' },
            { name: 'Society & Municipal Liaison', description: 'Follow-ups with RWA society offices or municipal paperwork.' },
        ],
    },
];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, catalogue_1, group, category, _a, _b, task, existingTask;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('Seeding task catalogue...');
                    _i = 0, catalogue_1 = catalogue;
                    _c.label = 1;
                case 1:
                    if (!(_i < catalogue_1.length)) return [3 /*break*/, 8];
                    group = catalogue_1[_i];
                    return [4 /*yield*/, prisma.category.upsert({
                            where: { slug: group.slug },
                            update: { name: group.category },
                            create: { name: group.category, slug: group.slug },
                        })];
                case 2:
                    category = _c.sent();
                    _a = 0, _b = group.tasks;
                    _c.label = 3;
                case 3:
                    if (!(_a < _b.length)) return [3 /*break*/, 7];
                    task = _b[_a];
                    return [4 /*yield*/, prisma.task.findFirst({
                            where: { name: task.name, categoryId: category.id },
                        })];
                case 4:
                    existingTask = _c.sent();
                    if (!!existingTask) return [3 /*break*/, 6];
                    return [4 /*yield*/, prisma.task.create({
                            data: {
                                name: task.name,
                                description: task.description,
                                categoryId: category.id,
                            },
                        })];
                case 5:
                    _c.sent();
                    _c.label = 6;
                case 6:
                    _a++;
                    return [3 /*break*/, 3];
                case 7:
                    _i++;
                    return [3 /*break*/, 1];
                case 8:
                    console.log('Task catalogue seeded successfully: 20 tasks across 4 categories.');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
