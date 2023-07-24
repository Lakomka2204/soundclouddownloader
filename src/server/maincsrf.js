import csurf from "csurf";
export default csurf({
    cookie:{
      key:"_csrf",
      secure:true,
      httpOnly:true,
      sameSite:'strict'
    },
  });