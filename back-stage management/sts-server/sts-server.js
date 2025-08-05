// sts-server.js
const express = require('express');
const PopCore = require('@alicloud/pop-core');
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());

// 初始化 STS 客户端配置
// 请注意，PopCore 的配置与之前不同
const clientConfig = {
    accessKeyId: process.env.ALICLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALICLOUD_ACCESS_KEY_SECRET,
    endpoint: 'https://sts.aliyuncs.com', // STS 的 Endpoint
    apiVersion: '2015-04-01' // STS 的 API 版本
};

// 使用 PopCore 初始化客户端
const stsClient = new PopCore(clientConfig);

app.get('/api/oss/upload/credentials', async (req, res) => {
    const roleArn = process.env.STS_ROLE_ARN;
    const roleSessionName = 'oss-upload-session';

    // 调用 AssumeRole 的 API 参数
    const params = {
        'Action': 'AssumeRole',
        'RoleArn': roleArn,
        'RoleSessionName': roleSessionName
    };

    const requestOption = {
        method: 'POST'
    };

    try {
        // 使用 client.request 方法调用 AssumeRole
        const response = await stsClient.request(
            'AssumeRole',
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
            message: 'success',
            data: credentials,
        });
        console.log("获取临时凭证成功");
        

    } catch (error) {
        console.error('Failed to assume STS role:', error);
        res.status(500).json({
            code: -1,
            message: '获取上传凭证失败',
            data: null,
        });
    }
});

app.listen(port, () => {
    console.log(`STS credential server listening at http://localhost:${port}`);
});