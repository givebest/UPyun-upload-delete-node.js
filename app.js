const express = require("express");
const cors = require('cors');
const app = express();
const crypto = require("crypto");
const axios = require('axios');
const cookieParser=require("cookie-parser");
const account = require('./config/account');

app.use(cookieParser());

const date = new Date().toGMTString();
const bucketname = account.UPyun.bucketname;  // 空间名
const key = account.UPyun.key; // 操作员
const secret = account.UPyun.secret; // 密码
const ypyunUrl = 'http://v0.api.upyun.com/'
const corsDomain = 'devops.wsp'

// CORS @see https://github.com/expressjs/cors
app.use(cors({
  origin: 'http://' + corsDomain,
  credentials: true
}));

app.set('port', process.env.PORT || 8082);
// Static server
app.use(express.static(__dirname));



// Upload
app.get("/api/token/upload", (req, res) => {
  let fileName = (Math.random() * 100000000) >>> 0;
  let expiration = ((Date.now() / 1000) >>> 0) + 30 * 60;  // 请求的过期时间，UNIX UTC 时间戳，单位秒。建议设为 30 分钟 http://docs.upyun.com/api/form_api/
  let method = "POST";

  let policy = base64(
    JSON.stringify({
      bucket: bucketname,
      // "save-key": "/" + fileName + "{.suffix}",
      "save-key": "/{filename}{.suffix}",
      expiration: expiration
    })
  );

  let authorization =
    "UPYUN " +
    key +
    ":" +
    hmacsha1(MD5(secret), method + "&/" + bucketname + "&" + policy);

  res.json({
    msg: "OK",
    code: 200,
    data: {
      authorization: authorization,
      policy: policy
    }
  });
});

// Delete
app.get('/api/token/del', (req, res) => {
  let item = req.query.item;
  let method = "DELETE"
  let authorization = "UPYUN " +
    key +
    ":" + 
    hmacsha1(MD5(secret), method + '&/' + bucketname + item + '&'+ date);


  axios({
    url: ypyunUrl + bucketname + item,
    method: 'DELETE',
    headers: {
      // 'Authorization': 'UPYUN devops:waBzsa4pkvoEKl0UHdwMEnOnmHg=',
      'Authorization': authorization,
      'Date': date
    }
  }).then(response => {
    res.json({
      msg: "OK",
      code: 200,
      data: {}
    });  
  }).catch(err => {
    console.log('err', err)
  })

})

// Set cookie
app.get('/api/cookie/test', (req, res) => {
  res.cookie('corsCookie', 'ddddddddd221dasda123123sd', { maxAge: 900000, httpOnly: false, domain: corsDomain });
  res.json({
    msg: 'ok',
    code: 200,
    data: {}
  })
})

// Get cookie
app.get('/api/cookie/get', (req, res) => {
  console.log('corsCookie', req.cookies)
  res.json({
    msg: 'ok',
    code: 200,
    data: {}
  })
})

// MD5
function MD5(value) {
  return crypto
    .createHash("md5")
    .update(value)
    .digest("hex");
}

// Base64
function base64(value) {
  return Buffer.from(value).toString("base64");
}

// hmacsha1
function hmacsha1(secret, value) {
    return crypto.createHmac('sha1', secret).update(value, 'utf-8').digest().toString('base64');
}

app.listen(app.get('port'), () => {
  console.log("http://localhost:" +  app.get('port'));
});
