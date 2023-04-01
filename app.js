// Require Modules
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
var _ = require("lodash");

const app = express();

// To connect with MongoDB 'toDoListDB' database
mongoose.connect("mongodb://localhost:27017/toDoListDB", {useNewUrlParser: true, useUnifiedTopology: true,  useFindAndModify: false});

// Schema for default list items
const itemSchema = {
  name: {
    type: String,
    required: [1, "Please check your data entry, 'name' should be specified!"]
  }
};

// Model for default list 'items'
const Item = mongoose.model("Item", itemSchema);

// Schema for Custom Lists
const listSchema = {
  name: {
    type: String,
    required: [1, "Please check your data entry, 'name' should be specified!"]
  },
  items: [itemSchema]
}

// Model for Custom Lists
const List = mongoose.model("List", listSchema);

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

app.get("/", function(req, res) {
  Item.find({}, function(err, items) {
    res.render("list", {listTitle: "Today", newListItems: items});
  });
});

app.get("/lists", function(req, res) {
  List.find({}, function(err, lists) {
    res.render("custom-lists", {lists: lists});
  });
});

app.get("/lists/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, list) {
    if (err) {
      console.log(err);
    } else {
      if (list) {
        res.render("list", {listTitle: customListName, newListItems: list.items});
      } else {
        const list = new List({
          name: customListName
        });

        list.save(function() {
        res.redirect("/lists/" + customListName);
        });

      }
    }
  });
});

app.post("/", function(req, res) {
  const newItemName = req.body.newItem;

  const listName = req.body.list;

  let item = new Item({
    name: newItemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, list) {
      list.items.push(item);
      list.save();
      res.redirect("/lists/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {
  const checkedItem_id = req.body.checkbox;

  const currentListName = req.body.listName;

  if (currentListName === "Today") {
    Item.deleteOne({_id: checkedItem_id}, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted checked item from DB!");
      }
    });

    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: currentListName}, {$pull: {items: {_id: checkedItem_id}}}, function(err, list) {
      list.save();
      res.redirect("/lists/" + currentListName) ;
    });
  }

});

app.listen(3000, function() {
  console.log("Server started on port: 3000");
});
