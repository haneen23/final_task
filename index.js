var mysql = require('mysql');
var express = require('express');
var Math = require('math');
var PDFDocument = require('pdfkit');
var fs = require('fs');
var https = require('https');

var app = express();
var port = process.env.PORT || 8080;
var user_name;
var responseStr = "MySQL Data:";
var mysqlHost = process.env.MYSQL_HOST || 'localhost';
var mysqlPort = process.env.MYSQL_PORT || '3306';
var mysqlUser = process.env.MYSQL_USER || 'root';
var mysqlPass = process.env.MYSQL_PASS || '';
var mysqlDB   = process.env.MYSQL_DB   || 'final_test';
var lat;
var long;
var address_id;
var connectionOptions = {
    host: mysqlHost,
    port: mysqlPort,
    user: mysqlUser,
    password: mysqlPass,
    database: mysqlDB
};
sortArrayOfObjects = (arr, key) => {
    return arr.sort((a, b) => {
        return a[key] - b[key];
    });
};


Math.getDistance = function( x1, y1, x2, y2 ) {

    var xs = x2 - x1,
        ys = y2 - y1;

    xs *= xs;
    ys *= ys;

    return Math.sqrt( xs + ys );
};
var connection = mysql.createConnection(connectionOptions);
var user;
var house;
var people;
var address;
var given_likes;
var recieved_likes;
var matches;
var chats;
var old_men;
connection.connect();
/*
*/
app.get('/pdf/:user_id',function(req,res){

    connection.query('SELECT id,name,surname FROM users WHERE id = ? ',[req.params.user_id], (err, rows, fields) => {
        if (!err){

            rows.forEach(function(data){
                user_name = data.name;
                user =  data.name.concat(' ',data.surname);

            });

            //res.send(rows);
            }
        else
            console.log(err);
    })
    connection.query('SELECT id,propertytype,address_id FROM houses WHERE user_id = ? ',[req.params.user_id], (err, rows, fields) => {
        if (!err){
            rows.forEach(function(data){
                address_id = data.address_id;
                console.log(data.propertytype)
                switch (data.propertytype){
                    case 0:
                        house = data.id.toString().concat(' ','-')
                    case 1:
                        house = data.id.toString().concat(' ','FLAT')
                    case 2:
                        house = data.id.toString().concat(' ','SMALL HOUSE')
                    case 3:
                        house = data.id.toString().concat(' ','BIG HOUSE')
                    case 4:
                        house = data.id.toString().concat(' ','VILLA')
                }
            });

            res.send(rows);
        }
        else

            console.log(err);

    })

    connection.query('SELECT * FROM addresses WHERE id = ?',[address_id],(err, rows, fields) => {
        if (!err){

                address = JSON.stringify(rows) ;


            //res.send(rows);
            fs.writeFileSync([user]+'.pdf', JSON.stringify(user.concat(' ',house,' ',address,' ',given_likes)));

        }

    else
            console.log(err);
        })


});

// this api returns all postcodes that belongs to the same group
app.get('/postcodes/:start' , (req, res) => {

    connection.query('SELECT * FROM postcodes WHERE postcode LIKE ?',[req.params.start]+'%', (err, rows, fields) => {
        if (!err)
            res.send(rows);
        else
            console.log(err);
    })

} );
// this api returns all postcodes that belongs to the same group
app.get('/locations/:postcode/:filter' , (req, res) => {
switch (req.params.filter){
    case 'bus':
        connection.query('SELECT latitude,longitude FROM postcodes WHERE id = ? ',[req.params.postcode], (err, rows, fields) => {
            if (!err)
                rows.forEach(function(data){
                    lat = data.latitude;
                    long = data.longitude;

                });
            else
                console.log(err);
        })
        var full_data_dictionary = []
        var full_data_dictionary_result = []
        connection.query('SELECT id,lat,lon,name FROM busstops', (err, rows, fields) => {
            if (!err){
                rows.forEach(function(data){
                    obj = {'id':data.id, 'distance':Math.getDistance(lat,long,data.lat,data.lon), 'name':data.name}
                    full_data_dictionary.push(obj);
                });
                sortArrayOfObjects(full_data_dictionary, "distance");
                for (i = 0; i < 5; i++) {
                    full_data_dictionary_result.push(full_data_dictionary[i]['name']);
                }
                res.send(full_data_dictionary_result);
            }

            else
                console.log(err);
                        })

    case 'school':
        connection.query('SELECT latitude,longitude FROM postcodes WHERE id = ? ',[req.params.postcode], (err, rows, fields) => {
            if (!err)
                rows.forEach(function(data){
                    lat = data.latitude;
                    long = data.longitude;

                });
            else
                console.log(err);
        })
        connection.query('SELECT latitude,longitude,id FROM postcodes',(err, rows, fields) => {
            let full_result = []
            if (!err){
                rows.forEach(function(data){
                    if(data.latitude != null && data.longitude != null) {
                        if(Math.getDistance(lat,long,data.latitude,data.longitude) <= 10){
                            connection.query('SELECT * FROM schools WHERE postcode_id = ?',[data.id],(err, rows, fields) => {
                                if (!err){
                                    rows.forEach(function(data){
                                        full_result.push(data);
                                    })}
                                else
                                    console.log(err);
                            })

                        }
                    }

                });
                res.send(full_result);

            }
            else
                console.log(err);
        });
    case 'address':
        connection.query('SELECT * FROM addresses WHERE postcode_id = ?',[req.params.postcode], (err, rows, fields) => {
            if (!err)
                res.send(rows);
            else
                console.log(err);
        })
}


} );

app.listen(port, function(){
    console.log('Sample mySQL app listening on port ' + port);
});