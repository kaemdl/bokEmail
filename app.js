const express = require("express");
const bodyParser = require("body-parser");
const fsp = require("fs").promises;
const express_session = require("express-session"); 
const cookieParser = require('cookie-parser');

// 쿠키 파서 미들웨어 사용


const app = express();
const port = process.env.port || 1010;

// 파일 경로
const USERS_FILE = "./users.json";
const EMAILS_FILE = "./emails.json";

let keys, emailKeys;
keys = [];
emailKeys = [];
// console.log(keys[0]);

// JSON 및 Form 데이터 처리
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express_session({
    secret: 'secret-key',             // 세션 암호화 키
    resave: false,                    // 변경 없을 경우에도 저장 여부
    saveUninitialized: true           // 초기값이 없더라도 저장 여부
}));
function keySearch(input) {
    let key;
    let email;
    for (let i = 0; i < keys.length; i++ ) {
        if (keys[i] == input) {
            key = keys[i];
            break;
        }
    }
    if (key != undefined) {
        const index = key.indexOf("_");

        // 앞부분 잘라서 복사
        email = index !== -1 ? key.slice(0, index) : key;
        for (let i = 0; i < emailKeys.length; i++) {
            if (email == emailKeys[i]) {
                return email;
            }
        }
        // if (key )
    }
    else {
        return;
    }
    return;
}

async function getUserConfig(email) {
    const userDB = JSON.parse(await fsp.readFile(USERS_FILE, "utf-8"));
  return userDB.find(user => user.email === email);
}


app.listen(port, () => {
    console.log("localhost:" + port);
});

// 템플릿 감싸는 미들웨어
app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function (body, data) {
        if (data == undefined) {
            data = "<h3>뿡뿡 뉴스 : 뿡뿡 이메일에서 새로운 이메일을 만들 수 있습니다.</h3>";
        }
        const styledBody = `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <title>Styled 뿡뿡 이메일</title>
                <style>
                    body { font-family: Arial; background-color: #00930aff; color: #333; padding: 20px; }
                    .content, .data {
                        max-width: 800px;
                        margin: auto;
                        padding: 20px;
                        background: #fff;
                        border-radius: 8px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    h1, h2 { text-align: center; }
                    input, textarea { padding: 10px; margin: 5px 0; width: 100%; border-radius: 8px; box-sizing: border-box; }
                    button { padding: 10px 15px; border: none; border-radius: 8px; color: white; cursor: pointer; }
                    .submit { background-color: #007bff; }
                    .submit:hover { background-color: #0056b3; }
                    .cancel {background-color:#555}
                    .email_title:hover { cursor : pointer }
                </style>
            </head>
            <body>
                <div class="content">${body}</div>
                <br>
                <div class="data">${data}</div>
            </body>
            </html>
        `;
        if (!res.headersSent) {
            return originalSend.call(this, styledBody);
        }
    };
    next();
});
app.get("/keys", (req, res) => {
    console.log(keys, emailKeys);
})

// 기본 메인 화면
app.get("/", async (req, res) => {
    try {
        const email = req.cookies.email;
        const key = req.session.key;

        if (keySearch(key) != email) {
            console.log("보안 문제 발생!!!!!");
        }
        let emails = {};
        try {
            emails = JSON.parse(await fsp.readFile(EMAILS_FILE, "utf-8"));
        } catch {
            try {
                fsp.writeFile(EMAILS_FILE, "[]");
            } catch {
                console.log("[뿡뿡 이메일]이메일 파일 생성 중 오류 발생!!");
            } finally {
                res.redirect("/");
            }
        }
        // if (emails == undefined) 
        // 해당 사용자 이메일로 전송된 이메일 필터링
        const userEmails = emails.filter(e => e.form === email);
        let emailListHTML = "<h2 class='send_email'>보낸 메일";
        console.log(userEmails.length);
        if (userEmails.length == 0) {
            emailListHTML += "이 없습니다.</h2><ul>";
        }
        else {
            emailListHTML += "</h2><ul>"
            for (const e of userEmails) {
                emailListHTML += `
                    <li>
                    <strong class='email_title'>받은 사람 : ${e.to}</strong> ${e.subject}<br>
                    <div class='email_content'>
                        <strong>To:</strong> ${e.to}<br>
                            <strong>Time:</strong> ${new Date(e.time).toLocaleString()}<br>
                            <strong>Body:</strong> ${e.body}
                    </div>
                    </li><hr>
                `;
            }
        }
        emailListHTML += "</ul>";
        const sendUserEmails = emails.filter(e => e.to === email);
        let sendEmailListHTML = "<h2>받은 메일";
        if (sendUserEmails.length == 0) {
            sendEmailListHTML += "이 없습니다.</h2><ul>";
        }
        else {
            sendEmailListHTML += "</h2><ul>";
            for (const e of sendUserEmails) {
                            sendEmailListHTML += `
                    <li>
                        <strong class='email_title'>${e.to}</strong> ${e.subject}<br>
                        <div class='email_content'>
                        <h2>${e.subject}</h2><br>
                        <strong>보낸 사람 : </strong> ${e.to}<br>
                            <h3></h3> ${new Date(e.time).toLocaleString()}<br>
                            <strong></strong> ${e.body}
                        </div>
                    </li><hr>
                `;
            }
        }
        sendEmailListHTML += "</ul>"
        res.send(
            `<h1>뿡뿡 이메일</h1>
            <p>${email}님 환영합니다!</p>
            ${sendEmailListHTML}${emailListHTML}
            <a href='/newEmail'>회원가입</a> | 
            <a href='/loginForm/default'>로그인</a> | 
            <a href='/sendEmailForm'>이메일 보내기</a>
            <script>
const email_contents = document.getElementsByClassName("email_content");
const email_titles = document.getElementsByClassName("email_title");
const send_email = document.getElementsByClassName("send_email");
const send_email_title = document.getElementsByClassName("send_email_title");

for (let i = 0; i < email_titles.length; i++) {
  email_contents[i].style.display = "none"; // 초기에는 안 보이게 설정

  email_titles[i].addEventListener("click", () => {
    if (email_contents[i].style.display === "none") {
      email_contents[i].style.display = "";
    } else {
      email_contents[i].style.display = "none";
    }
  });
}
            </script>`
        );
    } catch (error) {
        console.log(error);
        res.redirect("/loginForm/default");
    }
});

// 회원가입 (폼 + API)
app.get("/newEmail", (req, res) => {
    res.send(`<h1>회원 가입</h1>
        <form action='/signup' method='post'>
            <input type='email' name='email' placeholder='이메일'>
            <input type='password' name='password' placeholder='비밀번호'>
            <button type='submit' class='submit'>회원 가입</button>
            <button type='button' class='submit' onclick='window.location.href="/loginForm/default"'>이미 계정이 있나요? 로그인 하기</button>
            <button type='button' class='cancel' onclick='window.location.href="/"'>취소</button>
        </form>

        `);
});

app.post("/signup", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "필수 입력 누락" });
    try {
        let users = [];
        try {
            users = JSON.parse(await fsp.readFile(USERS_FILE, "utf-8"));
        } catch { users = []; }
        if (users.find(u => u.email === email)) return res.status(409).json({ message: "이미 존재하는 이메일" });
        users.push({ email, password });
        await fsp.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        res.send(`<h1>회원 가입 완료!</h1><a href='/loginForm/default'>로그인하러 가기</a><a href=''>`);
    } catch {
        res.status(500).json({ error: "회원가입 오류" });
    }
});

// 로그인 (폼 + API)
app.get("/loginForm/:type", (req, res) => {
    const type = req.params.type;
    let sendMsg = `<h1>로그인</h1>
        <form action='/login' method='post'>
            <input type='email' name='email' placeholder='이메일'>
            <input type='password' name='password' placeholder='비밀번호'>
            <button type='submit' class='submit'>로그인</button>
            <button type='button' class='submit' onclick='window.location.href="/newEmail"'>계정이 없나요? 회원 가입 하기</button>
            <button type='button' class='cancel' onclick='window.location.href="/"'>취소</button>
        </form>`
    if (type == 'no_email') {
        sendMsg += `<p>이메일이 틀렸습니다.</p>`
    }
    else if (type == 'no_password') {
        sendMsg += `<p>비밀 번호가 틀렷습니다.</p><a href='passwordSearch'>비밀 번호 찾기</a>`
    }
    else if (type == '500') {
        sendMsg += `<p>오류가 발생했습니다. 오류 코드 : 500</p>`
    }
    else if (type == "includes_") {
        sendMsg += `<p>이메일에는 _가 포함되면 안됩니다.</p>`
    }
    res.send(sendMsg);
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const users = JSON.parse(await fsp.readFile(USERS_FILE, "utf-8"));
        const user = users.find(u => u.email === email && u.password === password);
        if (users.find(u => u.email === email)) {
            console.log("1단계 확인 완료");
            // res.send(`<h1>${email}님, 환영합니다!</h1><a href='/sendEmailForm'>이메일 보내기</a>`);
        } else {
            return res.redirect('/loginForm/no_email');
        }
        if (users.find(u => u.password === password)) {
            console.log("a");
            if (email.includes("_")) {
                return res.redirect(`/loginForm/includes_`);
            }
            res.cookie('email', email, { maxAge : 1000 * 60 * 60 * 24});
            res.cookie('password', password, { maxAge : 1000 * 60 * 60 * 24});
            console.log("a");
            const key = Math.random();;
            console.log("a");
            req.session.email = email;
            req.session.password = password;
            req.session.key = key;
            console.log("a");
            keys.push(email + "_" + key);
            emailKeys.push(email);
            res.send(`<h1>로그인 성공!!</h1><a href='/'>메인 메뉴로 돌아가기</a>`);
        }
        else {
            res.redirect(`/loginForm/no_password`);
        }
    } catch {
        res.redirect(`/loginForm/500`);
        // res.status(500).json({ error: "로그인 오류" });
    }
});

// 이메일 보내기 (폼 + JSON 저장)
app.get("/sendEmailForm", (req, res) => {
    try {
        const email = req.cookies.email;
        const password = req.cookies.password;
  } catch {
    res.send(`<h1>로그인이 되지 않았습니다.</h1><a href='/loginForm/default'>로그인 하기</a><a href='/newEmail'>회원 가입 하기</a><a href='/'>메인 메뉴로 돌아가기</a>`);
  }
    res.send(`<h1>이메일 보내기</h1>
        <form action='/sendEmail' method='post'>
            <input type='text' name='to' placeholder='받는 사람'>
            <input type='text' name='subject' placeholder='제목'>
            <textarea name='body' placeholder='내용'></textarea>
            <button type='submit' class='submit'>전송</button>
            <button type='button' class='cancel' onclick='window.location.href="/"'>취소</button>
        </form>`);
});

const nodemailer = require("nodemailer");

app.post("/sendEmail", async (req, res) => {
  const { to, subject, body } = req.body;
  const email = req.cookies.email;
  const key = req.session.key;

//   if (!keySearch(key) == email) {
    // console.log("보안 문제 발생!!!!!");
    // return res.status(401).send("인증 오류");
//   }

  if (!to || !subject || !body)
    return res.status(400).json({ error: "입력 누락" });

  const emailObj = { form: email, to, subject, body, time: new Date().toISOString() };

  try {
    // 저장
    let emails = [];
    try {
      emails = JSON.parse(await fsp.readFile(EMAILS_FILE, "utf-8"));
    } catch { emails = []; }
    emails.push(emailObj);
    await fsp.writeFile(EMAILS_FILE, JSON.stringify(emails, null, 2));

    // 다음 메일 전송
    const creds = getUserConfig(email);
    const transporter = nodemailer.createTransport({
      host: creds.smtp.host,
      port: creds.smtp.port,
      secure: creds.smtp.secure,
      auth: {
        user: creds.email,
        pass: creds.password
      }
    });

    await transporter.sendMail({
      from: creds.email,
      to,
      subject,
      text: body
    });

    res.send("<h1>이메일 전송 완료! (저장+발송)</h1><a href='/'>돌아가기</a>");
  } catch (err) {
    console.log("에러:", err);
    res.status(500).json({ error: "이메일 처리 오류" });
  }
});