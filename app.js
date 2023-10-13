const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//---------------------------------------Mongoose Connection---------------------------------------
mongoose.connect("mongodb+srv://u2003252:test123@todolist.z52gmon.mongodb.net/todolistDB", {useNewUrlParser:true})
  .then(() => {
    console.log("Successfully connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

//---------------------------------------Mongoose Schema---------------------------------------
  const itemsSchema = mongoose.Schema({
    name: String
  });

//---------------------------------------Mongoose Model---------------------------------------
  const Item = mongoose.model("item", itemsSchema);

//---------------------------------------Mongoose Documents------------------------------------
  const item1 = new Item({
    name: "Welcome to the Todolist"
  });

  const item2 = new Item({
    name: "Press + to add new item"
  });

  const item3 = new Item({
    name: "<-- Hit this to delete an item"
  });


const defaultitems = [item1, item2, item3];

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

//---------------------------------------Mongoose Documents Insertion------------------------------------
// Item.insertMany(defaultitems)
//   .then(() => {
//     console.log("Successfully inserted ");
//     mongoose.connection.close();
//   })
//   .catch((err) => {
//     console.log(err);
//   });

app.get("/", function (req, res) {
  
  Item.find()
    .then((results) => {

      if(results.length === 0){
        Item.insertMany(defaultitems)
        .then(() => {
          console.log("Successfully inserted ");
        })
        .catch((err) => {
          console.log(err);
        });
      }
      else{
        res.render("list", { listTitle: "Today", newlistitems: results });
      }
  })
    .catch((err) => {
      console.log(err);
    });

});

app.get("/:customlistname", function(req, res) {
  const customlistname = _.capitalize(req.params.customlistname);

  List.findOne({ name: customlistname })
    .then(foundList => {
      if (!foundList) {
        // create a new list
        const list = new List({
          name: customlistname,
          items: defaultitems
        });
      
        list.save();

        res.redirect("/" + customlistname);
      } else {
        // show an existing list

        res.render("list", { listTitle: foundList.name, newlistitems: foundList.items });
      }
    })
    .catch(err => {
      console.log(err);
    });

});


app.post("/", function (req, res) {
  const itemname = req.body.newitem;
  const listname = req.body.listbutton;

  const item = new Item({
    name: itemname
  });

  if (listname == "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listname })
      .then(foundList => {
        foundList.items.push(item);
        return foundList.save();
      })
      .then(() => {
        res.redirect("/" + listname);
      })
      .catch(err => {
        console.log(err);
      });
  }
});


app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;


  if (listName == "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(() => {
        console.log("Successfully deleted checked items");
        res.redirect("/");
      })
      .catch(err => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
      .then(foundList => {
        res.redirect("/" + listName);
      })
      .catch(err => {
        console.log(err);
      });
  }
});

app.listen(3000, function () {
  console.log("Server is up and running on port 3000");
});
