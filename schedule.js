exports.view = function(req, res){
  if (!req.session.user){
    res.render('schedule/schedule', {
      title: 'Schedule Not available ' 
    });
  } else {
    res.render('schedule/schedule', {
      title: 'Viewing Schedule ' 
    });
  }
  };