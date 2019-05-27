var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table");

var table;
var tableArray;

// create the connection information for the sql database
var connection = mysql.createConnection({
    host: "localhost",

    // Your port; if not 3306
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "",
    database: "bamazon"
});

connection.connect(function (err) {
    if (err) throw err;
    // run the start function after the connection is made to prompt the user
    start();
});

function start() {
    // User interface for customer
    table = new Table({
        head: ['ID', 'Product', 'Department', 'Price', 'Quantity']
    });
    tableArray = [];

    connection.query("SELECT * FROM products", function (err, results) {
        if (err) throw err;
        for (let i = 0; i < results.length; i++) {
            table.push([results[i].item_id, results[i].product_name, results[i].department_name, results[i].price, results[i].stock_quantity]);
            tableArray.push(results[i].product_name);
        }


        console.log(table.toString());
        inquirer.prompt({
            name: "itemPurchase",
            type: "list",
            message: "Which item would you like to purchase?",
            choices: tableArray
        }).then(function (answer) {
            var stock = (item) => {
                for (let i = 0; i < results.length; i++) {
                    if (results[i].product_name === item)
                        return results[i].stock_quantity;
                }
            };
            stock = stock(answer.itemPurchase);
            inquirer.prompt({
                name: "itemQuantity",
                type: "input",
                message: "How many " + answer.itemPurchase + " do you want to purchase?",
                validate: function validatePurchase(quantity) {
                    var itemQuantity = parseInt(quantity);
                    if (typeof itemQuantity !== 'number') return false;
                    if (itemQuantity > stock) {
                        console.log("\nInsufficient quantity!");
                        return false;
                    }
                    return true;
                }
            }).then(function (purchase) {
                var remainingStock = stock - purchase.itemQuantity;
                connection.query("UPDATE products set ? WHERE ?", [{
                            stock_quantity: remainingStock
                        },
                        {
                            product_name: answer.itemPurchase
                        }
                    ],
                    function (err) {
                        if (err) throw err;
                        console.log(answer.itemPurchase + " purchased!");
                        start();
                    });
            });
        });
    });


}