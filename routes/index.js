var express = require('express');
var router = express.Router();
var uuidV4 = require('uuid').v4;
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('layout',{page:"index", title:"Express RTC"});
});

router.get('/new', function(req, res, next) {
  res.redirect(`/${uuidV4()}`)
});

router.get('/:room', function(req, res, next) {
  res.render('layout', {room: req.params.room, title:"Chat Room", page:"chatRoom"});
});


module.exports = router;
