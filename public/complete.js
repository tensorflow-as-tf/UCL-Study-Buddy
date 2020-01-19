var lastCircle = "null";
var colour = "null";
var size = "null";
var taken = [];
var students2 = {};
var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = decodeURIComponent(window.location.search.substring(1)),
    sURLVariables = sPageURL.split("&"),
    sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split("=");

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : sParameterName[1];
    }
  }
};

$(document).ready(function() {
  var id = getUrlParameter("id");
  var authKey = getUrlParameter("key");
  var url = "/oauth/userdata/" + id + "/" + authKey;
  var name;
  $.getJSON(url, function(data) {
    console.log(data);
    if (data["ok"] == true) {
      name = data["name"];
      students2 = data["users"];
      console.log(students2);
      $("#full_name").html(data["name"]);
      $("#department").html(data["department"]);
      var tbl_body = "";
      var odd_even = false;
      var index2 = 0;
      $.each(data.users, function() {
        var tbl_row = "";
        var index = 0;
        index2+=1;
        $.each(this, function(k, v) {
          if (index == 2) {
            tbl_row += "<td>" + "Library" + "</td>";
          } else if (index == 3) {
            tbl_row += "<td>" + "Floor: 2" + "</td>";
          } else {
            tbl_row += "<td>" + v + "</td>";
          }
          index++;
        });
        tbl_body +=
          '<tr class="' +
          (odd_even ? "odd" : "even") +
          '"'+"id="+"table"+index2+'>' +
          tbl_row +
          "</tr>";
        odd_even = !odd_even;
      });
      $("#table").html(tbl_body);
    }
  });
  var url = "/map";
  $.get(url, function(data2) {
    $("#container").append(data2);
    $("svg").attr("width", 1000);
    $("svg").attr("height", 500);
    $("svg").attr("id", "map");
    $("circle").click(function(event) {
      if (event.currentTarget.getAttribute("fill") != "#552782") {
        if (lastCircle != "null") {
          lastCircle.setAttribute("fill", colour);
          lastCircle.setAttribute("r", size);
        }
        lastCircle = event.currentTarget;
        colour = lastCircle.getAttribute("fill");
        size = lastCircle.getAttribute("r");
        $.post(
          "/map/add",
          { name: name, id: lastCircle.parentElement.getAttribute("id") },
          function(data2) {}
        );
        event.currentTarget.setAttribute("r", 256.0);
        event.currentTarget.setAttribute("fill", "#552782");
      } else {
        var txt = getKeyByValue(
          taken,
          event.currentTarget.parentElement.getAttribute("id")
        );
        var found = students2.find(function(element) {
          console.log(element);
          return element["name"] == txt;
        });
        
        
        $("#table tr").each(function () {

          $('td', this).each(function () {
              var value = $(this).text()==txt;
              console.log($(this).text());
              console.log(value);
              if(value){
                $(this).css("background-color", "#552782");
              }
           })

      })
        
        
      }
    });
    var url = "/map/people/";
    $.get(url, function(data3) {
      Object.keys(data3).forEach(function(key) {
        console.log(key);

        taken = data3;

        $("#" + data3[key])
          .children()
          .attr("fill", "#552782");
      });
    });
  });
});

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}
