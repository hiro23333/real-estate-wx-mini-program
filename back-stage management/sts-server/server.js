// server.js
const express = require("express");
const PopCore = require("@alicloud/pop-core");
const OSS = require("ali-oss");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto"); // 新增：引入crypto模块
const { log } = require("console");
require("dotenv").config();

const app = express();
const port = 3001;

// --- 中间件 ---
app.use(cors());
app.use(bodyParser.json());

// --- OSS 配置 ---
const ossConfig = {
  region: process.env.OSS_REGION,
  bucket: process.env.OSS_BUCKET,
};

// --- JWT 配置 ---
const JWT_SECRET = process.env.JWT_SECRET;

// --- STS 客户端配置 ---
const stsClientConfig = {
  accessKeyId: process.env.ALICLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALICLOUD_ACCESS_KEY_SECRET,
  endpoint: "https://sts.aliyuncs.com",
  apiVersion: "2015-04-01",
};
const stsClient = new PopCore(stsClientConfig);

// --- OSS SDK 客户端 ---
const ossSignedUrlClient = new OSS({
  region: ossConfig.region,
  accessKeyId: process.env.ALICLOUD_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALICLOUD_ACCESS_KEY_SECRET,
  bucket: ossConfig.bucket,
  secure: true, // 在这里全局指定使用 HTTPS
});

// --- JWT 认证中间件 ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res.status(401).json({ code: 401, message: "请登录" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res
        .status(401)
        .json({ code: 401, message: "登录过期，请重新登录" });
    }
    req.user = user;
    next();
  });
};

// --- API 路由定义 ---

// 1. 获取 OSS 上传临时凭证 (STS)
app.get("/api/user/oss/upload/credentials", async (req, res) => {
  const roleArn = process.env.STS_ROLE_ARN;
  const roleSessionName = "oss-upload-session";

  const policy = {
    Statement: [
      {
        Action: ["oss:PutObject"],
        Effect: "Allow",
        Resource: [`acs:oss:*:*:${ossConfig.bucket}/*`],
      },
    ],
    Version: "1",
  };
  const policyBase64 = Buffer.from(JSON.stringify(policy)).toString("base64");

  // --- 新增：计算签名 ---
  const accessKeySecret = process.env.ALICLOUD_ACCESS_KEY_SECRET;
  const signature = crypto
    .createHmac("sha1", accessKeySecret)
    .update(policyBase64)
    .digest("base64");
  // ----------------------

  const params = {
    Action: "AssumeRole",
    RoleArn: roleArn,
    RoleSessionName: roleSessionName,
    Policy: JSON.stringify(policy),
    DurationSeconds: 3600,
  };

  const requestOption = {
    method: "POST",
  };

  try {
    const response = await stsClient.request(
      "AssumeRole",
      params,
      requestOption
    );

    const credentials = {
      accessKeyId: response.Credentials.AccessKeyId,
      securityToken: response.Credentials.SecurityToken,
      region: ossConfig.region,
      bucket: ossConfig.bucket,
      endpoint: `${ossConfig.bucket}.${ossConfig.region}.aliyuncs.com`,
      policy: policyBase64,
      signature: signature, // 替换为真实计算出的签名
    };

    res.json({
      code: 0,
      message: "success",
      data: credentials,
    });
    console.log("获取OSS上传临时凭证成功");
  } catch (error) {
    console.error("获取OSS上传临时凭证失败:", error);
    res.status(500).json({
      code: -1,
      message: "获取上传凭证失败",
      data: null,
    });
  }
});

// 2. 获取 OSS 文件的签名 URL
app.get("/api/user/oss/get-signed-url", async (req, res) => {
  const { ossPath } = req.query;

  if (!ossPath) {
    return res.status(400).json({
      code: -1,
      message: "ossPath 参数缺失",
    });
  }

  try {
    const signedUrl = ossSignedUrlClient.signatureUrl(ossPath, {
      expires: 3600,
    });

    res.json({
      code: 0,
      message: "success",
      data: {
        signedUrl,
      },
    });
    console.log("获取签名 URL 成功:", signedUrl);
  } catch (error) {
    console.error("获取签名 URL 失败:", error);
    res.status(500).json({
      code: -1,
      message: "获取签名 URL 失败",
      data: null,
    });
  }
});

// 4. 模拟一个需要认证的房源列表接口
app.get("/api/user/property/list", authenticateToken, (req, res) => {
  console.log(
    `用户 ${req.user.username} (ID: ${req.user.userId}) 已认证，正在请求房源列表。`
  );
  res.json({
    code: 0,
    message: "success",
    data: [
      { id: 101, title: "认证房源 - 阳光公寓", price: 5000 },
      { id: 102, title: "认证房源 - 时代广场", price: 8000 },
    ],
  });
});

//后台管理用的oss
app.get("/api/oss/upload/credentials", async (req, res) => {
  const roleArn = process.env.STS_ROLE_ARN;
  const roleSessionName = "oss-upload-session";

  // 调用 AssumeRole 的 API 参数
  const params = {
    Action: "AssumeRole",
    RoleArn: roleArn,
    RoleSessionName: roleSessionName,
  };

  const requestOption = {
    method: "POST",
  };

  try {
    // 使用 client.request 方法调用 AssumeRole
    const response = await stsClient.request(
      "AssumeRole",
      params,
      requestOption
    );

    const credentials = {
      accessKeyId: response.Credentials.AccessKeyId,
      accessKeySecret: response.Credentials.AccessKeySecret,
      securityToken: response.Credentials.SecurityToken,
      region: process.env.OSS_REGION,
      bucket: process.env.OSS_BUCKET,
      endpoint: `${process.env.OSS_BUCKET}.${process.env.OSS_REGION}.aliyuncs.com`,
    };

    res.json({
      code: 0,
      message: "success",
      data: credentials,
    });
    console.log("获取临时凭证成功");
  } catch (error) {
    console.error("Failed to assume STS role:", error);
    res.status(500).json({
      code: -1,
      message: "获取上传凭证失败",
      data: null,
    });
  }
});

const mockBanner = [
  {
    banner_id: 1,
    oss_path: "real-estate/1754417659021-o6auo17dd.png",
    property_id: 101,
  },
  {
    banner_id: 2,
    oss_path: "real-estate/1754417659021-o6auo17dd.png",
    property_id: 102,
  },
  {
    banner_id: 3,
    oss_path: "real-estate/1754417659021-o6auo17dd.png",
    property_id: 103,
  },
];

const mockCommunities = [
  { community_id: 1, name: "阳光花园" },
  { community_id: 2, name: "未来社区" },
  { community_id: 3, name: "金贸广场" },
];

const mockTags = [
  { tag_id: 1, name: "学区房" },
  { tag_id: 2, name: "近地铁" },
  { tag_id: 3, name: "精装修" },
  { tag_id: 4, name: "拎包入住" },
  { tag_id: 5, name: "带家电" },
];

const mockProperties = [
  {
    property_id: 101,
    title: "阳光花园三室两厅",
    category: "rent",
    area: 120,
    price: 5000,
    publish_time: "2025-08-09T10:00:00Z",
    community_id: 1,
    tags: [
      { tag_id: 1, name: "学区房" },
      { tag_id: 3, name: "精装修" },
    ],
    image_oss_path: "real-estate/1754417659021-o6auo17dd.png",
  },
  {
    property_id: 102,
    title: "未来社区两居室出售",
    category: "sale",
    area: 95,
    price: 3500000,
    publish_time: "2025-08-08T15:30:00Z",
    community_id: 2,
    tags: [{ tag_id: 2, name: "近地铁" }],
    image_oss_path: "real-estate/1754417659021-o6auo17dd.png",
  },
  {
    property_id: 103,
    title: "金贸广场商铺出租",
    category: "commercial",
    area: 80,
    price: 15000,
    publish_time: "2025-08-07T09:00:00Z",
    community_id: 3,
    tags: [],
    image_oss_path: "real-estate/1754417659021-o6auo17dd.png",
  },
  {
    property_id: 104,
    title: "阳光花园公寓出租",
    category: "rent",
    area: 50,
    price: 3000,
    publish_time: "2025-08-06T12:00:00Z",
    community_id: 1,
    tags: [{ tag_id: 1, name: "学区房" }],
    image_oss_path: "real-estate/1754417659021-o6auo17dd.png",
  },
  {
    property_id: 105,
    title: "金贸广场商铺出租",
    category: "commercial",
    area: 80,
    price: 15000,
    publish_time: "2025-08-07T09:00:00Z",
    community_id: 3,
    tags: [],
    image_oss_path: "real-estate/1754417659021-o6auo17dd.png",
  },
  {
    property_id: 106,
    title: "金贸广场商铺出租",
    category: "commercial",
    area: 80,
    price: 15000,
    publish_time: "2025-08-07T09:00:00Z",
    community_id: 3,
    tags: [],
    image_oss_path: "real-estate/1754417659021-o6auo17dd.png",
  },
  {
    property_id: 107,
    title: "金贸广场商铺出租",
    category: "commercial",
    area: 80,
    price: 15000,
    publish_time: "2025-08-07T09:00:00Z",
    community_id: 3,
    tags: [],
    image_oss_path: "real-estate/1754417659021-o6auo17dd.png",
  },
  {
    property_id: 108,
    title: "金贸广场商铺出租",
    category: "commercial",
    area: 80,
    price: 15000,
    publish_time: "2025-08-07T09:00:00Z",
    community_id: 3,
    tags: [],
    image_oss_path: "real-estate/1754417659021-o6auo17dd.png",
  },
  {
    property_id: 109,
    title: "金贸广场商铺出租",
    category: "commercial",
    area: 80,
    price: 15000,
    publish_time: "2025-08-07T09:00:00Z",
    community_id: 3,
    tags: [],
    image_oss_path: "real-estate/1754417659021-o6auo17dd.png",
  },
  {
    property_id: 110,
    title: "金贸广场商铺出租110",
    category: "commercial",
    area: 80,
    price: 15000,
    publish_time: "2025-08-07T09:00:00Z",
    community_id: 3,
    tags: [],
    image_oss_path: "real-estate/1754417659021-o6auo17dd.png",
  },
  {
    property_id: 111,
    title: "金贸广场商铺出租111",
    category: "commercial",
    area: 80,
    price: 15000,
    publish_time: "2025-08-07T09:00:00Z",
    community_id: 3,
    tags: [],
    image_oss_path: "real-estate/1754417659021-o6auo17dd.png",
  },
];

// --- API 路由 ---

// POST /api/banner/list
app.post("/api/banner/list", (req, res) => {
  res.json({ code: 0, message: "success", data: mockBanner });
});

// POST /api/tags
app.post("/api/tags", (req, res) => {
  res.json({ code: 0, message: "success", data: mockTags });
});

// POST /api/community
app.post("/api/community", (req, res) => {
  res.json({ code: 0, message: "success", data: mockCommunities });
});

// POST /api/property/list
app.post("/api/property/list", (req, res) => {
  const {
    page = 1,
    pageSize = 10,
    category,
    keyword,
    community_id,
    tag_ids,
    sort_by,
  } = req.body;

  let filteredData = [...mockProperties];

  // 1. 筛选
  if (category) {
    filteredData = filteredData.filter((item) => item.category === category);
  }
  if (keyword) {
    filteredData = filteredData.filter((item) => item.title.includes(keyword));
  }
  // community_id 直接作为 number 类型进行比较
  if (community_id !== undefined && community_id !== null) {
    filteredData = filteredData.filter(
      (item) => item.community_id === community_id
    );
  }
  // tag_ids 直接作为 number 数组进行比较
  if (tag_ids && tag_ids.length > 0) {
    filteredData = filteredData.filter((item) =>
      item.tags.some((tag) => tag_ids.includes(tag.tag_id))
    );
  }

  // 2. 排序
  switch (sort_by) {
    case "latest":
      filteredData.sort(
        (a, b) =>
          new Date(b.publish_time).getTime() -
          new Date(a.publish_time).getTime()
      );
      break;
    case "price_asc":
      filteredData.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      filteredData.sort((a, b) => b.price - a.price);
      break;
    case "area_asc":
      filteredData.sort((a, b) => a.area - b.area);
      break;
    case "area_desc":
      filteredData.sort((a, b) => b.area - a.area);
      break;
    default:
      break;
  }

  // 3. 分页
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = filteredData.slice(start, end);

  res.json({ code: 0, message: "success", data: paginatedData });
});

// 模拟收藏状态，用于在多个请求中保持状态
const favoriteProperties = new Set();
app.post("/api/favorite/toggle", (req, res) => {
  const { user_id, property_id } = req.body;

  // 检查请求体中是否包含必要的参数
  if (user_id === undefined || property_id === undefined) {
    return res.status(400).json({
      code: 1,
      message: "Invalid parameters: user_id and property_id are required.",
    });
  }

  // 模拟收藏/取消收藏逻辑
  let isFavorited = favoriteProperties.has(property_id);
  if (isFavorited) {
    favoriteProperties.delete(property_id);
    isFavorited = false;
  } else {
    favoriteProperties.add(property_id);
    isFavorited = true;
  }

  // 返回模拟结果
  res.json({
    code: 0,
    message: "success",
    data: {
      favorite: isFavorited,
    },
  });
});

const mockPropertyDetails = [
  {
    property_id: 101,
    title: "阳光花园三室两厅",
    category: "rent",
    address: "南山区南山街道阳光花园",
    house_type: "3室2厅",
    area: 120,
    floor: "8层",
    price: 5000,
    orientation: "向南",
    description:
      "1.地理位置：南山区南山街道阳光花园，近地铁9号线，交通便利；2.房子描述：大单间+卫生间+厨房，东南朝向，通风采光非常好，家电齐全（床+柜+书桌，空调+热水器+洗衣机）",
    community_id: 1,
    tags: [
      { tag_id: 1, name: "学区房" },
      { tag_id: 3, name: "精装修" },
    ],
    is_favorite: true,
    images: [
      { oss_path: "real-estate/1754417659021-o6auo17dd.png", sort_order: 1 },
      { oss_path: "real-estate/1754417659021-o6auo17dd.png", sort_order: 2 },
      { oss_path: "real-estate/1754417659021-o6auo17dd.png", sort_order: 3 },
    ],
  },
  {
    property_id: 102,
    title: "未来社区两居室出售",
    category: "sale",
    address: "南山区未来社区",
    house_type: "2室1厅",
    area: 95,
    floor: "15层",
    price: 3500000,
    orientation: "向北",
    description:
      "此房为精装修，户型方正，楼层视野开阔，采光极佳，交通方便，近地铁站。",
    community_id: 2,
    tags: [{ tag_id: 2, name: "近地铁" }],
    is_favorite: false,
    images: [
      { oss_path: "real-estate/1754417659021-o6auo17dd.png", sort_order: 1 },
    ],
  },
  {
    property_id: 103,
    title: "金贸广场商铺出租",
    category: "commercial",
    address: "福田区金贸广场",
    house_type: "商铺",
    area: 80,
    floor: "1层",
    price: 15000,
    orientation: "向西",
    description: "商铺位于金贸广场一层，人流量大，适合各类商业用途。",
    community_id: 3,
    tags: [],
    is_favorite: false,
    images: [
      { oss_path: "real-estate/1754417659021-o6auo17dd.png", sort_order: 1 },
    ],
  },
  {
    property_id: 104,
    title: "阳光花园公寓出租",
    category: "rent",
    address: "南山区南山街道阳光花园",
    house_type: "1室1卫",
    area: 50,
    floor: "12层",
    price: 3000,
    orientation: "向东",
    description: "单身公寓出租，家电齐全，拎包入住，小区环境优美。",
    community_id: 1,
    tags: [{ tag_id: 1, name: "学区房" }],
    is_favorite: false,
    images: [
      { oss_path: "real-estate/1754417659021-o6auo17dd.png", sort_order: 1 },
    ],
  },
];
app.post("/api/property/detail", (req, res) => {
  const { property_id } = req.body;

  // 检查请求体中是否包含必要的参数
  if (property_id === undefined) {
    return res.status(400).json({
      code: 1,
      message: "Invalid parameters: property_id is required.",
    });
  }

  // 根据 property_id 查找对应的房源详情
  const detail = mockPropertyDetails.find(
    (item) => item.property_id === property_id
  );

  if (detail) {
    // 模拟返回详情数据
    res.json({
      code: 0,
      message: "success",
      data: detail,
    });
  } else {
    // 如果没有找到，返回错误
    res.status(404).json({
      code: 1,
      message: "Property not found.",
    });
  }
});

// POST /api/message/submit
app.post("/api/message/submit", (req, res) => {
  const { user_id, property_id, content } = req.body;

  if (!user_id || !property_id || !content) {
    return res.status(400).json({
      code: 1,
      message:
        "Invalid parameters: user_id, property_id, and content are required.",
    });
  }

  // console.log(`Received message for property ${property_id} from user ${user_id}: "${content}"`);

  // 模拟返回成功
  res.json({
    code: 0,
    message: "提交成功",
  });
});

// POST /api/login
app.post("/api/login", (req, res) => {
  const { code, encryptedData, iv } = req.body;

  if (!code || !encryptedData || !iv) {
    return res.status(400).json({
      code: 1,
      message: "Invalid parameters: code, encryptedData, iv are required.",
    });
  }

  //   console.log(`Received message${code}${encryptedData}${iv}`);

  // 模拟返回成功
  res.json({
    code: 0,
    message: "提交成功",
    data: {
      user_id: "10001",
      phone: "13800138001",
      nickname: "微信用户_10001",
      avatar_oss_path: "real-estate/1754417659021-o6auo17dd.png",
      token: "mock_token_10001",
    },
  });
});

const mockMessages = [
  {
    message_id: 101,
    property_id: 101,
    property_title: "阳光花园xxx",
    content: "贵吗",
    is_replied: false,
  },
  {
    message_id: 102,
    property_id: 102,
    property_title: "市中心低调奢华小洋墅",
    content: "能养鸡吗",
    is_replied: true,
    replied_content:
      "我们在三天之内会电话给您回复，还有别的疑问可以咨询我们的电话'1234-1234-123'",
  },
];

// POST /api/message/list
app.post("/api/message/list", (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({
      code: 1,
      message: "Invalid parameters: user_id are required.",
    });
  }

  // console.log(`Received request${user_id}`);

  // 模拟返回成功
  res.json({
    code: 0,
    message: "提交成功",
    data: mockMessages,
  });
});

// POST /api/favorite/list
app.post("/api/favorite/list", (req, res) => {
  const {
    user_id,
    page = 1,
    pageSize = 10,
    category,
    keyword,
    community_id,
    tag_ids,
    sort_by,
  } = req.body;

  let filteredData = [...mockProperties];

  // 1. 筛选
  if (category) {
    filteredData = filteredData.filter((item) => item.category === category);
  }
  if (keyword) {
    filteredData = filteredData.filter((item) => item.title.includes(keyword));
  }
  // community_id 直接作为 number 类型进行比较
  if (community_id !== undefined && community_id !== null) {
    filteredData = filteredData.filter(
      (item) => item.community_id === community_id
    );
  }
  // tag_ids 直接作为 number 数组进行比较
  if (tag_ids && tag_ids.length > 0) {
    filteredData = filteredData.filter((item) =>
      item.tags.some((tag) => tag_ids.includes(tag.tag_id))
    );
  }

  // 2. 排序
  switch (sort_by) {
    case "latest":
      filteredData.sort(
        (a, b) =>
          new Date(b.publish_time).getTime() -
          new Date(a.publish_time).getTime()
      );
      break;
    case "price_asc":
      filteredData.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      filteredData.sort((a, b) => b.price - a.price);
      break;
    case "area_asc":
      filteredData.sort((a, b) => a.area - b.area);
      break;
    case "area_desc":
      filteredData.sort((a, b) => b.area - a.area);
      break;
    default:
      break;
  }

  // 3. 分页
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = filteredData.slice(start, end);

  res.json({ code: 0, message: "success", data: paginatedData });
});

// POST /api/updateUserInfo
app.post("/api/updateUserInfo", (req, res) => {
  const { user_id, nickname, avatar_oss_path, phone } = req.body;

  if (!user_id || !nickname || !avatar_oss_path || !phone) {
    return res.status(400).json({
      code: 1,
      message: "Invalid parameters are required.",
    });
  }

  // console.log(`Received  ${nickname} ${user_id} ${avatar_oss_path} ${phone}`);

  // 模拟返回成功
  res.json({
    code: 0,
    message: "提交成功",
  });
});

// POST /api/logout
app.post("/api/logout", (req, res) => {
  // 模拟返回成功
  res.json({
    code: 0,
    message: "退出成功",
  });
});

// 新增头像上传接口
const multer = require("multer");
const path = require("path");

// 配置上传中间件（保留基础检查）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 保留2MB限制
  },
  fileFilter: (req, file, cb) => {
    // 基础文件类型检查
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".jpg", ".jpeg", ".png"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("只允许上传图片文件（JPG/PNG）"));
    }
  },
});

// 头像上传接口
app.post("/api/upload/avatar", upload.single("avatar"), async (req, res) => {
  try {
    // === 基础检查 ===
    if (!req.file) {
      console.warn("文件上传失败：", {
        headers: req.headers,
        body: req.body,
      });
      return res.status(400).json({
        code: 400,
        message: "未收到有效文件",
        debug: {
          receivedFile: !!req.file,
          contentType: req.headers["content-type"],
        },
      });
    }

    // === 文件信息日志 ===
    console.log("收到上传文件：", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // === OSS上传 ===
    const userId = 10001; //测试用id
    const fileName = `avatars/${userId}_${Date.now()}${path.extname(
      req.file.originalname
    )}`;

    const ossRes = await ossSignedUrlClient.put(fileName, req.file.buffer, {
      headers: {
        "Content-Type": req.file.mimetype,
      },
    });

    // === 生成访问URL ===
    const signedUrl = ossSignedUrlClient.signatureUrl(fileName, {
      expires: 3600 * 24 * 30, // 30天有效期
    });

    
    // === 成功响应 ===
    res.json({
      code: 0,
      data: {
        url: signedUrl,
        oss_path: fileName,
      },
    });
  } catch (error) {
    // === 错误处理 ===
    console.error("上传处理异常：", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      code: 500,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "上传服务暂不可用",
    });
  }
});

// 配置上传中间件
const propertyUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 9, // 最多9张图片
    fileSize: 5 * 1024 * 1024 // 5MB限制
  }
});

// 房源图片上传接口
app.post('/api/upload/property-image', 
  propertyUpload.single('image'),
  async (req, res) => {
    try {
      // 1. 基础验证
      if (!req.file) {
        return res.status(400).json({ 
          code: 400, 
          message: '未收到图片文件',
          receivedFields: req.body 
        });
      }

      // 2. 生成OSS路径
      const userId = 10001;
      const timestamp = Date.now();
      const ext = path.extname(req.file.originalname).toLowerCase();
      const ossPath = `real-estate/${userId}/${timestamp}_${Math.random().toString(36).substr(2, 6)}${ext}`;

      // 3. 上传到OSS
      await ossSignedUrlClient.put(ossPath, req.file.buffer, {
        headers: {
          'Content-Type': req.file.mimetype,
        }
      });

      console.log("上传图片");
      

      // 4. 返回结果
      res.json({
        code: 0,
        data: {
          image_id: `${userId}_${timestamp}`,
          oss_path: ossPath,
          url: ossSignedUrlClient.signatureUrl(ossPath, { expires: 3600 * 24 * 30 }),
          is_primary: req.body.is_primary === 'true',
          mime_type: req.file.mimetype,
          sort_order: parseInt(req.body.sort_order) || 0
        }
      });
    } catch (error) {
      console.error('房源图片上传失败:', error);
      res.status(500).json({ 
        code: 500,
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : '图片上传服务异常'
      });
    }
  }
);

// 提交房源信息接口
app.post('/api/property/submitByUser', 
  async (req, res) => {
    try {
      // 验证必填字段
      if (!req.body.images || !Array.isArray(req.body.images)) {
        return res.status(400).json({ code: 400, message: '缺少房源图片' });
      }

      console.log(req.body);
      

      // 保存到数据库
      const property={
        property_id:1001,
      };

      res.json({ code: 0, data: { property_id: property.id } });
    } catch (error) {
      console.error('房源提交失败:', error);
      res.status(500).json({ code: 500, message: '提交失败' });
    }
  }
);



// --- 启动服务器 ---
app.listen(port, () => {
  console.log(`服务器已启动，监听端口: http://localhost:${port}`);
});
