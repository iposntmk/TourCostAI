import type { MasterData } from "../types";

export const MASTER_DATA_STORAGE_KEY = "tour-cost-ai/master-data";

export const emptyMasterData: MasterData = {
  services: [],
  guides: [],
  perDiemRates: [],
  catalogs: {
    nationalities: [],
    serviceTypes: [],
  },
};

export const defaultMasterData: MasterData = {
  services: [
    {
      id: "svc-ba-na-ticket",
      name: "Vé tham quan Bà Nà Hills",
      category: "Vé tham quan",
      price: 850_000,
      unit: "khách",
      description: "Vé vào cổng kèm cáp treo và toàn bộ khu vui chơi trong ngày.",
    },
    {
      id: "svc-han-river-cruise",
      name: "Du thuyền sông Hàn buổi tối",
      category: "Trải nghiệm",
      price: 1_200_000,
      unit: "chuyến",
      description: "Thuê nguyên chuyến du thuyền sông Hàn, bao gồm nước suối và trái cây.",
    },
    {
      id: "svc-set-menu",
      name: "Bữa tối set menu Việt Nam",
      category: "Ẩm thực",
      price: 260_000,
      unit: "khách",
      description: "Thực đơn 4 món Việt Nam kèm nước uống chào mừng.",
    },
    {
      id: "svc-airport-transfer",
      name: "Xe đưa đón sân bay Đà Nẵng",
      category: "Vận chuyển",
      price: 550_000,
      unit: "chuyến",
      description: "Xe 16 chỗ đón tiễn sân bay, đã bao gồm phí đỗ và xăng dầu.",
    },
    {
      id: "svc-cham-museum",
      name: "Vé tham quan Bảo tàng Chăm",
      category: "Vé tham quan",
      price: 150_000,
      unit: "khách",
      description: "Vé tham quan bảo tàng điêu khắc Chăm tại Đà Nẵng.",
    },
  ],
  guides: [
    {
      id: "guide-cao-huu-tu",
      name: "Cao Hữu Từ",
      phone: "0905 123 456",
      email: "tu.cao@tourcost.ai",
      languages: ["Tiếng Việt", "Tiếng Anh"],
    },
    {
      id: "guide-lan-anh",
      name: "Nguyễn Lan Anh",
      phone: "0988 765 432",
      email: "lan.anh@tourcost.ai",
      languages: ["Tiếng Việt", "Tiếng Hàn"],
    },
    {
      id: "guide-tran-minh-phuc",
      name: "Trần Minh Phúc",
      phone: "0932 112 334",
      email: "minh.phuc@tourcost.ai",
      languages: ["Tiếng Việt", "Tiếng Anh", "Tiếng Pháp"],
    },
  ],
  perDiemRates: [
    {
      id: "perdiem-da-nang",
      location: "Đà Nẵng",
      rate: 450_000,
      currency: "VND",
      notes: "Áp dụng cho tour nội thành trong ngày.",
    },
    {
      id: "perdiem-hoi-an",
      location: "Hội An",
      rate: 500_000,
      currency: "VND",
      notes: "Bao gồm thời gian phục vụ tour tối phố cổ.",
    },
    {
      id: "perdiem-hue",
      location: "Huế",
      rate: 550_000,
      currency: "VND",
      notes: "Hỗ trợ tour tham quan Đại Nội và các lăng tẩm.",
    },
  ],
  catalogs: {
    nationalities: [
      "Việt Nam",
      "Singapore",
      "Malaysia",
      "Thái Lan",
      "Hoa Kỳ",
      "Đức",
      "Úc",
    ],
    serviceTypes: [
      "Vé tham quan",
      "Ẩm thực",
      "Vận chuyển",
      "Lưu trú",
      "Hướng dẫn viên",
      "Trải nghiệm",
    ],
  },
};
