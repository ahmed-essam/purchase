var express = require('express');
var router = express.Router();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var UrlEncodedParser = bodyParser.urlencoded({ extended: true });
var jsonParser = bodyParser.json({ limit: "50mb" });

var userModule = mongoose.model("users");
var productModule = mongoose.model('products');
var orderModule = mongoose.model('orders');

router.post('/add', jsonParser, function (request, response) {
    var flag = true;
    userModule.findOne({_id: request.body.userId}, {cart:1}, (err, res) => {
        if(!err){
            console.log(res.cart);
            
            res.cart.forEach(product => {
                console.log(product);                
                if(product == request.body.productId){
                    flag = false;
                    response.json({result: "already exist"})
                }                
            });
            
            if(flag){
                userModule.updateOne({ _id: request.body.userId }, { $push: { cart: request.body.productId } }, (err, res) => {
                    if (!err) {
                        response.json({ result: 'product added' });
                    } else {
                        response.json(err);
                    }
                });
        
            }
        }
    });

   

    
});

router.get('/:id', (request, response) => {
    userModule.findOne({ _id: request.params.id }, { cart: 1 }).populate('cart').exec((err, data) => {
        if (!err) {

            response.json(data.cart);
        } else {
            response.json(err);
        }
    });
});

router.delete('/:userId/:productId?', (request, response) => {
    if (request.params.productId) {
        userModule.updateOne({ _id: request.params.userId }, { $pull: { cart: request.params.productId } }, (err, res) => {
            if (!err) {
                response.redirect(303, '/api/cart/' + request.params.userId);
            }
        });
    } else {
        userModule.updateOne({ _id: request.params.userId }, { $set: { cart: [] } }, (err, res) => {
            if (!err) {
                response.redirect(303, '/api/cart/' + request.params.userId);
            }
        });
    }
});

router.post('/checkout', jsonParser, function (request, response) {
    var numberOfProducts = [];
    var products = [];
    var order = request.body;
    var count = 0;
    var error = [];

    for (var seller in order) {
        products = products.concat(order[seller].products);
        numberOfProducts = numberOfProducts.concat(order[seller].numbers);
    }

    function check() {
        if (count < products.length) {

            productModule.findOne({ _id: products[count] }, { stock: 1, name: 1 }, function (err, res) {

                if (!err) {
                    if (res.stock < numberOfProducts[count]) {
                        error.push({ name: res.name, available: res.stock });                        
                    }
                    count++;
                    check();
                }

            });
        } else {
            response.json(error);
        }

    }
    check();
});


router.post("/user", (request, response) => {
    var user = new userModule({
        name: "tarek",
        email:"gemy@gmail.com"
    });

    user.save((err, res) => {
        response.json({ mess: "ok" });
    });
});

module.exports = router;