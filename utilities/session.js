const sesh = (req) => {
  let session;
  session = req.session;
  session.userid = req.body.email;
};

export default sesh;
