const express = require('express');
const app = express();
const conn = require('./db');
const session = require('express-session');
const path = require('path');
require("dotenv").config();

app.set("views", "./views");
app.set("view engine", "pug");

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

const port = 3000

// GET index
app.get("/", (req, res) => {
  let usuario = req.session.email;
  if (!usuario) {
    usuario= "";
  }
  res.render("index", {
    _usuario: usuario
  });
});

// GET polaco
app.get("/polaco", (req, res) => {
  let usuario = req.session.email;
  if (!usuario) {
    usuario= "";
  }
  res.render("polaco", {
    _usuario: usuario
  });
});

// GET cultura
app.get("/cultura", (req, res) => {
  let usuario = req.session.email;
  if (!usuario) {
    usuario= "";
  }
  res.render("cultura", {
    _usuario: usuario
  });
});

// GET contactame
app.get("/contactame", (req, res) => {
  let usuario = req.session.email;
  if (!usuario) {
    usuario= "";
  }
  res.render("contactame", {
    _usuario: usuario
  });
});

// GET editar
app.get("/editar", (req, res) => {
  let usuario = req.session.email;
  if (!usuario) {
    res.redirect("login");
  } else {
    res.render("editar", {
      _usuario: usuario,
      _id: ""
    });
  }
});

// GET login
app.get("/login", (req, res) => {
  let msg = "";
  let usuario = req.session.email;
  if (usuario) {
    msg= "Bienvenido, " + usuario;
  }
  res.render("login", {
    _msg: msg
  });
});

// Hacer login
app.post("/login", (req, res) => {
  let msg= "";
  const usuario = req.body.usuario;
  const password = req.body.password;

  try {
    conn.query(`SELECT * FROM users WHERE email="${usuario}" AND password="${password}"`,
    (err, results, fields) => {
      if (err) throw err;
      if (!results.length) {
        msg= "No existe registro de usuario"
        res.render("login", {
          _msg: msg
        });
      }
      else {
        req.session.regenerate(err => {
          if (err) throw err;
          req.session.email= usuario;
          req.session.save(err => {
            if (err) throw err;
            res.redirect("posts");
          });
        });
      }
    });  
  } catch(err) {
    msg= "Ha ocurrido un error: " + err.sqlMessage;
    res.render("login", {
      _msg: msg
    });
  }
});

// Desloguearse
app.get("/logout", (req, res) => {
  let msg= "Ha ocurrido un error con su session"
  req.session.email= "";
  try {
    req.session.save(err => {
      if (err) throw err;
      req.session.regenerate(err => {
        if (err) throw err;
        res.redirect("/");
      });
    });
  } catch(err) {
    msg+= ": " + err.sqlMessage;
    res.render("login", {
      _msg: msg
    });
  }
});

// CREATE
// Agregar una entrada a la base de datos
app.post("/form", (req, res) => {
  const usuario = req.session.email;
  let msg = "Creado exitosamente.";
  const titulo = req.body.titulo;
  const comentarios = req.body.comentarios;
  const fecha = req.body.fecha;
  if (!titulo || !comentarios || !fecha) {
    msg= "Data incorrecta";
  }
  else {
    try {
      conn.query(`INSERT INTO posts (name, text, date) VALUES ("${titulo}", "${comentarios}", "${fecha}");`,
        (err, results, fields) => {
        if (err) throw err;
      });
    } catch(err) {
      msg= "Ha ocurrido un error: " + err.sqlMessage;
    }
    res.render("editar", {
      _msg: msg,
      _usuario: usuario
    });
  }
});


// READ
// Obtener lista de todos los posts
app.get('/posts', (req, res) => {
  const usuario= req.session.email;
  // const usuario = req.session.mail;

  if (usuario) {
    let msg = "Resultados: ";
    try {
      conn.query("SELECT * FROM posts;", (err, results, fields) => {
        if (err) throw err;
        if (!results.length) {
          msg = "No existen entradas."
        }
        res.render("admin", {
          _msg: msg,
          _results: results,
          _usuario: usuario
        });
      });
    } catch(err) {
      msg = "Ha ocurrido un error: " + err.sqlMessage;
      res.render("index", {
        _msg: msg,
        _results: [],
        _user: user
      });
    }
  }
  else {
    res.redirect("login");
  }
});

// Obtener un post en específico
app.get('/editar/:id', (req, res) => {
  const post_id = req.params.id;
  const usuario = req.session.email;
  let msg = "Resultado:";
  if (!usuario) {
    res.redirect("/login");
  } else {
    try {
      conn.query("SELECT * FROM posts WHERE id = " + post_id + ";",
        (err, results, fields) => {
        if (err) throw err;
        // console.log(results);
        if (!results.length) {
          msg = "No se encuentra registro"
        }
        res.render("editar", {
          _msg: msg,
          _usuario: usuario,
          _id: results[0].id,
          _name: results[0].name,
          _text: results[0].text,
          _results: results
        });
      });
    } catch(err) {
      msg = "Ha ocurrido un error: " + err.sqlMessage;
      res.render("index", {
        _msg: msg,
        _results: []
      });
    }
  }
});

// UPDATE
// Actualizar entrada por ID
app.post("/editar/:id", (req, res) => {
  let msg = "Actualizado exitosamente";

  const post_id = req.params.id;
  const name = req.body.titulo;
  const text = req.body.comentarios;

  try {
    conn.query(`UPDATE posts SET name="${name}", text="${text}" WHERE id=${post_id}`,
    (err, results, fields) => {
      if (err) throw err;
      if (!name || !text) {
        msg= "Datos incorrectos"
      }
    });
  } catch(err) {
    msg = "Ha ocurrido un error";
  }
  res.render("editar", {
    _msg: msg,
    _name: name,
    _text: text,
    _id: post_id
  });
});

// DELETE
// Eliminar una entrada por su ID
app.get("/borrar/:id", (req, res) => {
  const post_id = req.params.id;
  const usuario = req.session.email;
  let msg = "";
  if (!usuario) {
    res.redirect("login");
  } else {
    try {
      conn.query(`DELETE FROM posts WHERE id=${post_id}`, (err, results, fields) => {
        if(err) throw err;
      });
    } catch(err) {
      msg = "Ha ocurrido un error"
    }
    res.redirect("/posts");
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})