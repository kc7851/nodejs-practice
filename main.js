var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');



var app = http.createServer(function (request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathName = url.parse(_url, true).pathname;

  // console.log(pathName);

  if (pathName === '/') {
    if (queryData.id === undefined) {
      fs.readdir('./data', function (error, fileList) {
        var title = 'Welcome!';
        var description = 'Hello, Node.js!';
        var list = template.list(fileList);

        var html = template.html(title, list, `<h2>${title}</h2>
        <p>${description}</p>`,
        `<a href="/create">create</a>`);
        response.writeHead(200);
        response.end(html);
      });
    } else {
      fs.readdir('./data', function (error, fileList) {
        var filterdId = path.parse(queryData.id).base;
        fs.readFile(`data/${filterdId}`, 'utf8', function (err, description) {
          var title = queryData.id;
          var sanitizedTitle = sanitizeHtml(title);
          var sanitizedDescription = sanitizeHtml(description,{
            allowedTags: [ 'b', 'i', 'em', 'strong', 'a', 'h1' ],
            allowedAttributes: {
              'a': [ 'href' ]
            },
            allowedIframeHostnames: ['www.youtube.com']
          });
          var list = template.list(fileList);
          var html = template.html(sanitizedTitle, list, `<h2>${sanitizedTitle}</h2>
          <p>${sanitizedDescription}</p>`,`
          <a href="/create">create</a>
          <a href="/update?id=${sanitizedTitle}">update</a>
          <form action="/delete_process" method="POST">
            <input type="hidden" name="id" value=${sanitizedTitle}>
            <input type="submit" value="delete">
          </form>`);
          response.writeHead(200);
          response.end(html);
        });
      });
    }

  } else if (pathName === '/create') {
    fs.readdir('./data', function (error, fileList) {
      var title = 'Web - create!';
      var list = template.list(fileList);
      var html = template.html(title, list, `
      <form action="/create_process" method="POST">
    <p><input name="title" type="text" placeholder="title"></p>
    <p>
        <textarea name="description" cols="30" rows="10" placeholder="description"></textarea>
    </p>
    <p>
        <input type="submit">
    </p>
</form>
      `, '');
      response.writeHead(200);
      response.end(html);
    });
  } else if (pathName === '/create_process') {
    var body = '';
    request.on('data', function(data){
      body += data;
      if (body.length > 1e6){
        request.connection.destroy();
      }
    })
    request.on('end', function(){
      var post = qs.parse(body);
      console.log(post.title, post.description);
      fs.writeFile(`./data/${post.title}`, post.description, 'utf8', function(err){
        response.writeHead(302,
          {Location: '/?id='+post.title}
        );
        response.end();
      });
    })
    
  } else if (pathName === '/update') {
    fs.readdir('./data', function (error, fileList) {
      var filterdId = path.parse(queryData.id).base;
      fs.readFile(`data/${filterdId}`, 'utf8', function (err, description) {
        var title = queryData.id;
        var list = template.list(fileList);
        var html = template.html(title, list, 
        `<form action="/update_process" method="POST">
        <input name="id" type="hidden" value="${title}">
        <p><input name="title" type="text" value="${title}"></p>
        <p>
            <textarea name="description" cols="30" rows="10">${description}</textarea>
        </p>
        <p>
            <input type="submit">
        </p>
    </form>`,
        `<a href="/create">create</a>
        <a href="/update?id=${title}">update</a>`);
        response.writeHead(200);
        response.end(html);
      });
    });
  } else if (pathName === '/update_process') {
    var body = '';
    request.on('data', function(data){
      body += data;
      if (body.length > 1e6){
        request.connection.destroy();
      }
    })
    request.on('end', function(){
      var post = qs.parse(body);
      var title = post.title;
      var description = post.description;
      var id = post.id;
      var filterdId = path.parse(id).base;
      if(title !== id){
        fs.rename(`data/${filterdId}`, `data/${title}`, function(err){
          if (err) throw err;
        })
      }
      // console.log(title, description);
      fs.writeFile(`./data/${title}`, description, 'utf8', function(err){
        response.writeHead(302,
          {Location: '/?id='+title}
        );
        response.end();
      });
    })
    
  }  else if (pathName === '/delete_process') {
    var body = '';
    request.on('data', function(data){
      body += data;
      if (body.length > 1e6){
        request.connection.destroy();
      }
    })
    request.on('end', function(){
      var post = qs.parse(body);
      // console.log(post);
      var id = post.id;
      // console.log(id);
      fs.unlink(`data/${id}`, function(err){
        if (err) throw err;
        response.writeHead(302,
          {Location: '/'}
        );
        response.end();
      })
    })
  }else {
    response.writeHead(404);
    response.end('Not found');
  }





});
app.listen(3000);