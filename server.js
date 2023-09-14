const express = require("express");
const bcrypt = require("bcrypt");
const mailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const session = require("express-session");
var bodyParser = require("body-parser");

const app = express();
app.set("trust proxy", 1); // trust first proxy
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "martinpogi",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

const transporter = mailer.createTransport({
  service: "gmail",
  host: "smtp.google.com",
  port: 587,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: "mdmartin983@gmail.com",
    pass: "scztdnmijrznmhom",
  },
});

app.use(express.json());
app.use(express.static(__dirname + "/public"));

app.set("view engine", "ejs");

const unverified_users = [];
const users = [];
const otp_list = []; //---->GAWA BAGO ARRAY
const usersLoginVerifiedOtp = [];

// PAGES
app.get("/login", (req, res) => {
  res.render("login", { isOtp: false });
});

app.get("/login/otp", (req, res) => {
  res.render("login-otp");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/register/otp", (req, res) => {
  res.render("register-otp");
});

app.get("/dash", (req, res) => {
  res.render("dash");
});

/********** API ROUTES***********/

//DITO MAPUPUNTA PAG VERIFIED NA YUNG NAG REGISTER
app.get("/users", (req, res) => {
  res.json(users);
});

//DITO MALALAGAY YUNG INFO NG NAG REGISTER
app.get("/unverified_users", (req, res) => {
  res.json(unverified_users);
});

//--->  DITO YUNG OTP PAG NAG LOG IN
app.get("/otp_list", (req, res) => {
  res.json(otp_list);
});

app.post("/users/register", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
    });

    const user = {
      email: req.body.email,
      password: hashedPassword,
      otp,
    };

    unverified_users.push(user);

    const sendMail = await transporter.sendMail({
      from: '"MDC 👻" <mdmartin983@gmail.com>', // sender address
      to: `${user.email}`, // list of receivers
      subject: "MDC Registration ✔", // Subject line
      html: `OTP CODE: <b>${user.otp}</b>`, // html body
    });

    console.log("Message sent: %s", sendMail.messageId);
    res.render("register-otp");

    /****DI KO MACONNECT SA UI HAYUP******* */

    // console.log(my_email);
    // res.redirect(`/register/otp?email=${user.email}`);

    // res.sendFile(__dirname + "/views/register.ejs");
  } catch (e) {
    res.status(500).json(e);
  }
});

/*PARA SAAN BA KASI 'TO?? ANO BA GINAGAWA KOO??? */

// app.post("/users/otp/:email", () => {
//   try {
//     const otp = req.body.otp;
//     const email = req.params.email;

//     console.log(otp, email);
//   } catch (error) {
//     res.json(error);
//   }
// });

/*DI KO ALAM KUNG NAGANA
GUMANA NA SIYA HAHAHAHAHHAHA*/
app.post("/users/register/otp", async (req, res) => {
  try {
    const my_otp = req.body.otp;
    const lastOtp = unverified_users.find((element) => element.otp === my_otp);
    // unverified_users[unverified_users.length - 1].otp;

    //  my_otp = lastOtp;

    if (lastOtp) {
      // const lastRegister = unverified_users[unverified_users.length - 1];
      users.push(lastOtp);

      res.render("login", {
        message: "Successfully Registered",
        isOtp: true,
      });
    } else {
      res.json("Invalid OTP");
    }
  } catch (e) {
    res.status(500).json(e);
  }
});

app.post("/users/login", async (req, res) => {
  try {
    const user = users.find(function (user) {
      return user.email === req.body.email;
    });

    if (!user) {
      return res.status(400).json({ message: "Cannot find user" });
    }

    if (await bcrypt.compare(req.body.password, user.password)) {
      /************** HIRAP AH!***********/

      // res.json("Redirect to login OTP"); // Pano gawin 'to??
      // const salt = await bcrypt.genSalt();
      // const hashedPassword = await bcrypt.hash(req.body.password, salt);

      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
      });

      // const otpToLogin = {  // GETS NA KITA!!
      //   otp,
      // };

      otp_list.push(otp);

      const sendMail = await transporter.sendMail({
        from: '"MDC 👻" <mdmartin983@gmail.com>', // sender address
        to: `${user.email}`, // list of receivers
        subject: "MDC Registration ✔", // Subject line
        html: `OTP CODE: <b>${user.otp}</b>`, // html body
      });

      console.log("Login otp sent: %s", sendMail.messageId);
      res.render("login-otp");
    } else {
      res.json("Not allowed");
    }
  } catch (e) {
    res.status(500).json(e);
  }
});

app.post("/users/login/otp", async (req, res) => {
  try {
    const my_otp = req.body.otp;
    const lastOtp = otp_list[otp_list.length - 1]; //----!!! ito ang problem!!

    if (my_otp === lastOtp) {
      const lastRegister = otp_list[otp_list.length - 1];
      usersLoginVerifiedOtp.push(lastRegister);
      res.render("dash");
    } else {
      res.json("Invalid OTP");
    }
  } catch (e) {
    res.status(500).json(e);
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

/************DITO MO ILAGAY WAG AKONG MAGULUHA!!!***************/

// const otp = otpGenerator.generate(6, {
//   //gumawa ng OTP
//   upperCaseAlphabets: false,
//   specialChars: false,
// });

// const myLoginOtp = {
//   //di mo nilagay yung ginawang OTP sa taas
//   otp,
// };
// otp_list.push(myLoginOtp); // inistore mo sa API

// const my_otp = req.body.otp;
// const lastOtp = unverified_users[unverified_users.length - 1].otp;

// //  my_otp = lastOtp;

// if (my_otp === lastOtp) {
//   //gumamit ng if else para macompare
//   res.json({
//     success: true,
//     message: "OTP verified",
//   });

//   const lastRegister = unverified_users[unverified_users.length - 1];
//   users.push(lastRegister);
// } else {
//   res.json("Invalid OTP");
// }
