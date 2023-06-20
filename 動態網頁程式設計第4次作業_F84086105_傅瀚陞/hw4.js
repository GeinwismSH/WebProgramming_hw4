// <!--
// F84086105 傅瀚陞 第4次作業 5/17
// F84086105 HanShengFu The Fourth Homework 5/17
// -->

//網頁load完就開始
window.addEventListener( "load", function(){start();}, false );

var Cards = Array(209);  //從index=1開始算四副撲克牌
var colors = ["spades","hearts","diamonds","clubs"] //撲克牌花色
var bet = 0;  //下注區的浮動金額
var gamebet = 0;  //Deal後進入21點的確定金額
var money = 200;  //一開始的資金
var dealercheatcheck = 0; //紀錄作弊選項開關
var playercheatcheck = 0;
var tablecount = 0; //紀錄table數量
var backpokercard ="<img class='pokers' id='cardback' src='./cardback_blue.png' alt='./cardback_blue.png'>";//拿卡背

//取撲克牌圖函式
function getCards(){
  var count = 0; 
  for (var c in colors){
    for (var i = 1; i <= 13; ++i) {
        for(var j = 0; j < 4;++j){
        count++;
        Cards[count] = "<img class='pokers' id='"+colors[c] + i + "' src='./poker/" + i + "_of_"+colors[c]+".png' alt='./poker/" + i + "_of_"+colors[c]+".png'>";
      }
    }
  }
}

//一開始想用來初始化的，但後來發現有reload能用，因此內部應有一些廢code
function intialscreen(){
  $("#intial").show();
  $("#gameUI").show();
  $("#chipUI").show();
  $("#chipimg").show();
  $("#placebet").show();
  $("#hint").show();
  $("#main").hide();
  
  bet = 0;
  $("#mychips").text(bet);
  money = 200;
  $("#money").text(money);
  //取撲克牌圖
  getCards();
  Dealerpoint1=0;//A算11的狀況
  Dealerpoint2=0;//A算1的狀況
  Playerpoint1=0;//A算11的狀況
  Playerpoint2=0;//A算1的狀況
  $("#dealercards").html("");
  $("#mycards").html("");
  $("#dealerpoint").html("");
  $("#mypoint").html("");


  
}
tablecount = sessionStorage.length;
//Record table用，並存入sessionStorage
function Recording(event){
  tablecount++;
  $("#recordtable").append("<tr id="+tablecount+"><td>"+tablecount+"</td>"+"<td>"+event+"</td></tr>");
  // table變色
  var row = $("#"+tablecount);
  row.css("background-color", tablecount % 2 == 0 ? "rgb(156, 183, 184)" : "rgb(127, 224, 236)");
  
  sessionStorage.setItem(tablecount, event); //sessionStorage

}

//新增之前存下的紀錄到Record table
function putPreviousRecording(){
  var previousContext=[];
  for (var i = 0; i < sessionStorage.length; i++) {
    var id = sessionStorage.key(i);
    previousContext.push({key:id,value:sessionStorage.getItem(id)})

  }
  // 升序排列
  previousContext.sort(function(a, b) { 
    return a.key - b.key;
  });
  for (var i = 0; i < previousContext.length; i++) {
    // console.log(previousContext[i].key+":"+previousContext[i].value);
    $("#recordtable").append("<tr id="+previousContext[i].key+"><td>"+previousContext[i].key+"</td>"+"<td>"+previousContext[i].value+"</td></tr>");
    var row = $("#"+previousContext[i].key);
    row.css("background-color", previousContext[i].key % 2 == 0 ? "rgb(156, 83, 184)" : "rgb(127, 104, 236)");
  }
}

//用localStorage紀錄名稱、資金、總時間，會在每次玩完一局21點紀錄資金變動
//重複的名稱會覆蓋之前的紀錄，或許之後可以限制名稱不能相同
var thisPlayerMaxMoney = 0;
function MainStorage(playerName,playerMoney){

  var playerTime = calTime("#currentplayertime");
  // 若有最高金錢先存最高資金再存目前資金
  if (playerMoney > thisPlayerMaxMoney){
    thisPlayerMaxMoney = playerMoney;
    localStorage.setItem("localmax_"+playerName, thisPlayerMaxMoney);
  }
  //抓上次存的順序
  if (localStorage.getItem("order") == null) {
    // key不存在於localStorage中
    var playerOrder = 0; 
  } else {
    playerOrder = localStorage.getItem("order");  //抓之前的order
  }
  //存每個玩家最新的遊戲進度
  playerOrder++;  //設現在的order，再放入玩家最新資訊中
  var gameData = {playerMoney: playerMoney,playerTime: playerTime, playerOrder:playerOrder,};
  json = JSON.stringify(gameData);
  localStorage.setItem("order", playerOrder); //存最新的玩家目標，會用在loadgame上，loadgame就抓order最大的，就是最後玩的。
  localStorage.setItem(playerName, json); //玩家資訊存入localStorage

}

//要load game只要取出localStorage中儲存的最後一個即可
function loadGame(){
  nowOrder = localStorage.getItem("order");
  console.log(nowOrder);
  // 確定裡面有order
  if (nowOrder != null) {
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);

      if (!key.startsWith("localmax_")) { //抓每個玩家最新的遊戲進度

        data = JSON.parse(localStorage.getItem(key));

        if (data.playerOrder == nowOrder){
          newplayerName = key;
          if (data.playerMoney != 0){   //有錢才能繼續玩
            Recording("舊玩家: "+newplayerName+"載入遊戲");
            //名稱更改
            $("#currentplayer").text(newplayerName); 
            //資金更改
            money = data.playerMoney;
            $("#money").text(money);
            //時間更改(尚未處理，應接續之前的時間 )
            startTime = new Date(); //輸入名稱後記錄開始時間
  
            Rank(); //顯示玩家名稱及分數排名
            $("#main").show();
            $("#intial").hide();
            $("#gameUI").hide();
            // 每秒更新一次時鐘
            setInterval(updateClock, 1000);
          }else{
            alert("你上次已經破產拉，玩新的吧！");
          }

        }
      }
    }
  } else{
    alert("無上次紀錄，玩新的吧！");
  }
}



//Rank table用，取出localStorage的資訊並排列
function Rank(){

  //抓每個玩家的最高資金數
  var playerList = [];
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key.startsWith("localmax_")) {
      var playerName = key.split("_")[1];
      var playerMoney = localStorage.getItem(key);
      playerList.push({ key: playerName, value: playerMoney });
    }
  }

  //抓最長的遊戲時間
  var newplayList = [];

  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);

    if (!key.startsWith("localmax_")) { //抓每個玩家最新的遊戲進度
      for (var j = 0; j < playerList.length; j++){
        if (key == playerList[j].key) { //只會對中一個
          data = JSON.parse(localStorage.getItem(key));
          var playerTime = data.playerTime;
          newplayList.push({key: playerList[j].key, value1: playerList[j].value, value2: playerTime});
        }
      }
    }
  }

  // 降序排列
  newplayList.sort(function(a, b) {
    if (a.value1 != b.value1) {
      return b.value1 - a.value1;
    } else {
      return b.value2 - a.value2;
    }
  });
  

  //放到ranktable上
  $("#ranktable").html("<tr><td>排名</td><td>名稱</td><td>最大資金</td><td>時間</td></tr>");
  for (var j=0; j < newplayList.length; j++) {
    var player = newplayList[j];
    //秒轉分加秒
    var min = Math.floor(player.value2/60);
    var sec = Math.floor(player.value2%60);
    if (min < 10){
      min = "0"+min;
    }
    if (sec < 10){
      sec = "0"+sec;
    }
    
    $("#ranktable").append("<tr id="+player.key+"><td>"+(j+1)+"</td><td>"+player.key+"</td><td>"+player.value1+"</td><td>"+min+":"+sec+"</td></tr>");
    // table變色
    var row = $("#"+player.key);
    row.css("background-color", j % 2 == 0 ? "rgb(156, 183, 184)" : "rgb(127, 224, 236)");
  }
  
}

//全域的開始與結束時間
var startTime;
var endTime;
//固定記每一局結束的時間
function calTime(where){
  endTime = new Date(); 
  var timeDiff = endTime - startTime;
  var seconds = Math.floor(timeDiff / 1000);
  var min = Math.floor(seconds/60);
  var sec = Math.floor(seconds%60);
  if (min < 10){
    min = "0"+min;
  }
  if (sec < 10){
    sec = "0"+sec;
  }
  // $(where).text(min+":"+sec);

  return seconds;
}


//遊戲開始後每秒都會跳的時鐘
function updateClock() {
  var nowTime = new Date();
  var timeDiff = nowTime - startTime;
  var seconds = Math.floor(timeDiff / 1000);
  var min = Math.floor(seconds/60);
  var sec = Math.floor(seconds%60);
  if (min < 10){
    min = "0"+min;
  }
  if (sec < 10){
    sec = "0"+sec;
  }
  $("#currentplayertime").text(min+":"+sec);
}

//計時提醒器，一段時間沒點擊滑鼠就會跳通知
var timeoutID;
function startTimer() {
  // 15秒沒按任何東西就提醒
  timeoutID = window.setTimeout(function() {
    alert("您已經一段時間沒有進行遊戲了！快點玩吧親！");
    // console.log("閒置")
  }, 15000); 
}
function resetTimer() {
  // 重置計時器，清除之前設定的計時器
  window.clearTimeout(timeoutID);
  startTimer();
}

//無情的廣告機器
var ADtimeoutID;
var adcount = 0;  //讓廣告循環撥出，不辜負每一個投資者
function ADstartTimer() {
  adcount++;
  // 每20秒跳一次廣告
  ADtimeoutID = window.setTimeout(function() {
    if (adcount%4==1){
      $("#ads_container").html("<img id='ads' width='70%' style='position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);' src='./光電推薦.png'></img>")
    }else if(adcount%4==2){
      $("#ads_container").html("<img id='ads' width='70%' style='position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);' src='./成大推薦.png'></img>")
    }else if(adcount%4==3){
      $("#ads_container").html("<img id='ads' width='40%' style='position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);' src='./協尋.jpg'></img>")
    }else{
      $("#ads_container").html("<img id='ads' width='70%' style='position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);' src='./澳門賭場.jpg'></img>")
    }
    
    $("#ads_container").append("<div id='ads_close' style='background-color: red; position: fixed; top: 70%; left: 80%; width: 100px; height: 20px; z-index: 1;'>點此以關閉</div>")
  }, 20000); 
}
function ADresetTimer() {
  // 重置計時器，清除之前設定的計時器
  window.clearTimeout(ADtimeoutID);
  ADstartTimer();
}

// 看完說明開始遊戲
function startgame(playerName){
  Recording("新玩家："+playerName+"，開始遊戲");
  startTime = new Date(); //輸入名稱後記錄開始時間
  MainStorage(playerName,money);
  Rank(); //顯示玩家名稱及分數排名
  $("#currentplayer").text(playerName); //顯示目前玩家名稱
  $("#main").show();
  $("#intial").hide();
  $("#gameUI").hide();
  // 每秒更新一次時鐘
  setInterval(updateClock, 1000);
}

//全域的新玩家名稱
var newplayerName;

function start() {

  // localStorage.clear(); //測試用，刪除localStorage所有內容  
  intialscreen()  //初始化界面
  Rank(); //呼叫ranktable顯示玩家排名
  putPreviousRecording(); //把之前的table資料放上去

  //任何時候沒點東西就跳提醒，有點就重製
  startTimer();//開始計時器
  document.addEventListener("click", function() {
    window.clearTimeout(timeoutID);
    resetTimer(); //有點東西就重製
  });

  //廣告計時器
  ADstartTimer();
  $("#ads_container").on("click", "#ads_close", function() {
    //點擊close就關掉並重製
    window.clearTimeout(ADtimeoutID);
    $("#ads_container").empty();
    ADresetTimer(); 
  });

  //開始遊戲按鈕
  $("#start").click(function() {
    newplayerName = $("#playerName").val().trim(); // 取得輸入的玩家名稱並去除首尾空格
    if (newplayerName !== "") { // 確認玩家名稱不為空
      // 開始新遊戲，用 playerName 代表新玩家的名稱
      startgame(newplayerName);
    }
  });

  //載入舊遊戲按鈕
  $("#loadoldgame").on("click", loadGame);

  //重新開始遊戲按鈕
  $("#Regame").on("click", function() {
    location.reload();
  });

  // 莊家作弊按鈕，按下就開啟作弊模式
  $("#dealercheat").on("change", function() {
    if ($(this).is(":checked")) {
      Recording("莊家作弊按鈕開");
      dealercheatcheck = 1;
    } else {
      Recording("莊家作弊按鈕關");
      dealercheatcheck = 0;
    }
  });

  // 玩家作弊按鈕，按下就開啟作弊模式
  $("#playercheat").on("change", function() {
    if ($(this).is(":checked")) {
      Recording("玩家作弊按鈕開");
      playercheatcheck = 1;
    } else {
      Recording("玩家作弊按鈕關");
      playercheatcheck = 0;
    }
  });
  
  //設置籌碼所對應函數
  $("#ten").on("click", function() {
    PlaceBet(10);
  });
  $("#fifty").on("click", function() {
    PlaceBet(50);
  });
  $("#onehundred").on("click", function() {
    PlaceBet(100);
  });
  $("#fivehundred").on("click", function() {
    PlaceBet(500);
  });
  $("#onethousand").on("click", function() {
    PlaceBet(1000);
  });

  // 清除提交的籌碼
  $("#clear").on("click", function() {
    bet = 0;
    $("#mychips").text(bet);
  });

  // 提交籌碼進入21點遊戲
  $("#deal").on("click", PushBet);
  
  
}


//選擇下注金額函式
function PlaceBet(value) {
  //限制籌碼不超過資金
  if (value <= money - bet) {
    bet += parseInt(value);
  }
  $("#mychips").text(bet);
}


//確定下注金額，並關閉下注區，開啟21點遊戲程式
function PushBet() {
  if (bet != 0) {
    gamebet = bet;
    money = money - gamebet;
    Recording("下注 " + bet);
    Recording("開始賭局");
    $("#money").html(money);
    $("#hint").html("資金 -" + gamebet + "，開始賭局");
    $("#chipimg").hide();
    $("#placebet").hide();
    $("#gameUI").show();
    $("#mainbutton").show();
    $("#dealercheat, #playercheat").prop("disabled", true); //進入遊戲不給改作弊選項
    Blackjack(); //21點遊戲程式
  }
}


/*** 以下皆21點主遊戲相關程式 ***/

var Dealercolor = [];  //存出現過的花色
var Playercolor = [];  //存出現過的花色
var Dealernumber = [];  //存出現過的點數
var Playernumber = [];  //存出現過的點數
var Dealerpoint1 = 0;//A算11的狀況
var Dealerpoint2 = 0;//A算1的狀況
var Playerpoint1 = 0;//A算11的狀況
var Playerpoint2 = 0;//A算1的狀況

//21點遊戲程式
function Blackjack(){
  //先跑各抽兩張的函式
  var count = 0;
  var interval = setInterval(function() {
    if (count == 4) {
      clearInterval(interval); // 結束 setInterval
      return;
    }
    if (count%2 == 0){
      Dealer();
    }else{
      Player();
    }
    count++;
  }, 250);

  //不知道為什麼改成jQuery會怪怪的，先不改
  var Hit = document.getElementById( "Hit" );
  var Stand = document.getElementById( "Stand" );
  var Signal = document.getElementById( "Signal" );
  var Surrender = document.getElementById( "Surrender" );
  var Split = document.getElementById( "Split" );

  Hit.addEventListener( "click", Player, false );
  Stand.addEventListener("click",StandB, false);
  Signal.addEventListener( "click", SignalBet, false);
  Surrender.addEventListener( "click", Surrendergame, false);
  Split.addEventListener( "click", SplitCard, false);
}

//用來存出現過的玩家卡圖片
var PlayerCardSet=[];
var DealerCardSet=[];
var SplitCardNumber1;
var SplitCardNumber2;
//首抽兩個數字一樣，可分牌
function SplitCard(){
  if (Playernumber.length == 2 && Playernumber[0] == Playernumber[1]) {
    if (money >= gamebet) {
      Recording("分牌");
      money -= gamebet;
      $("#hint").html("您已分牌並加注，資金 -" + gamebet + "，先玩第一副!");
      $("#mycards").html(
        "<div id='leftcards' style='width: 50%; float: left;'>左邊的區塊</div>" +
        "<div id='rightcards' style='width: 50%; float: right;'>右邊的區塊</div>"
      );

      // console.log(Playernumber);
      document.getElementById("leftcards").innerHTML = PlayerCardSet[0];
      document.getElementById("rightcards").innerHTML = PlayerCardSet[1];
      SplitCardNumber1=Playernumber[0];
      SplitCardNumber2=Playernumber[1];

      //先第一副
      Playernumber = [];
      Playernumber[0] =  SplitCardNumber1;
      ({cardcolor,cardnumber} = DrawCard("leftcards")); //抓牌並顯示
      Playernumber.push(cardnumber);
      CalPlayer();  //算玩家牌的分數
      

      //爆掉或stand後換第二副
      //再第二副
      Playernumber = [];
      Playernumber[0] =  SplitCardNumber2;
      ({cardcolor,cardnumber} = DrawCard("rightcards")); //抓牌並顯示
      Playernumber.push(cardnumber);
      CalPlayer("secondpoint");  //算玩家牌的分數

      $("#hint").html("此功能未完善，無法使用QQ，請按【好的】按鈕回去，不會扣你錢!");
      ShowFinalCard();
      $("#again").html("<button onclick=BacktoBet(gamebet*3)>好的</button>");
    } else {
      $("#hint").html("你錢不夠，不能分牌!");
    }
  } else {
    $("#hint").html("兩張牌不同，現在不可split");
  }
}

//投降輸一半
function Surrendergame() {
  Recording("Surrender");
  gamebet /= 2;
  //要補莊家翻牌
  $("#hint").html("你投降了你好爛!扣一半籌碼，歸回資金 -" + gamebet + " !");
  $("#mainbutton").hide();

  ShowFinalCard();
  $("#again").html("<button onclick = BacktoBet(gamebet)>好的</button>");
}

//加注，多給一倍籌碼扣資金，然後抽一張牌並Stand
function SignalBet() {
  if (money >= gamebet) {
    Recording("加注 " + gamebet);
    money -= gamebet;
    $("#money").text(money);
    $("#hint").text("您已加注，資金 -" + gamebet);
    gamebet *= 2;
    $("#mychips").text(gamebet);
    var justonehit = 1; //加注後只能再拿一張，給拿牌函式的提示，讓他拿完後跳stand函式

    setTimeout(function() {
      Player(justonehit);
    }, 1000);
  } else {
    $("#hint").text("你錢不夠，不能加注!");
  }
}


//為了把直接按Stand按鈕與間接自動跳到stand功能的步驟做分別，多一個呼叫步驟
function StandB(){
  Recording("Stand");
  StandCard();
}

//不拿牌了，看莊家玩
function StandCard() {
  $("#hint").text("換莊家的回合！");
  // Stand後不能再用按鈕
  $("#mainbutton").hide();

  // 能按stand一定還沒爆牌，但因有bug發生，保險起見還是加個
  var Playerpoint;
  if (Playerpoint1 > 21) {
    Playerpoint = Playerpoint2;
  } else {
    Playerpoint = Playerpoint1 > Playerpoint2 ? Playerpoint1 : Playerpoint2;
  }

  $("#mypoint").text(Playerpoint);
  var Dealerpoint;

  var dealerInterval = setInterval(function() {
    if (Dealerpoint1 > 21) {
      Dealerpoint = Dealerpoint2;
    } else {
      Dealerpoint = Dealerpoint1 > Dealerpoint2 ? Dealerpoint1 : Dealerpoint2;
    }
    // 還沒17要繼續翻牌
    if (Dealerpoint < 17) {
      $("#hint").text("莊家拿牌！");
      Dealer();
    } else {
      clearInterval(dealerInterval);
      // 延遲提示的顯示
      setTimeout(function() {
        StandCondition(Dealerpoint, Playerpoint);
      }, 100);
    }
  }, 700);
}


//進入stand狀態後的輸贏判斷
function StandCondition(Dealerpoint, Playerpoint) {
  if ((Dealerpoint == 21) && (Playerpoint != 21)) {
    $("#hint").html("莊家21點，你輸了! 失去籌碼 !");
    Recording("莊家21點，輸了$"+gamebet)
    ShowFinalCard();
    $("#again").html('<button onclick="BacktoBet(0)">好的</button>');

  } else if (Dealerpoint > 21) {
    $("#hint").html("莊家爆牌，你贏了! 資金 +" + gamebet*2 + " !");
    Recording("莊家爆牌，贏了$"+gamebet)
    ShowFinalCard();
    $("#again").html('<button onclick="BacktoBet(' + gamebet*2 + ')">好的</button>');

  } else if (Playerpoint == 21) {
    if (Dealerpoint == 21) {
      $("#hint").html("雙方都21點，平手! 拿回籌碼，資金 +" + gamebet + " !");
      Recording("雙方皆21點平手")
      ShowFinalCard();
      $("#again").html('<button onclick="BacktoBet(' + gamebet + ')">好的</button>');
    } else {
      $("#hint").html("你21點，你贏了! 資金 +" + gamebet*2 + " !");
      Recording("玩家21點，贏了$"+gamebet)
      ShowFinalCard();
      $("#again").html('<button onclick="BacktoBet(' + gamebet*2 + ')">好的</button>');
    }

  } else if (Dealerpoint < 21) {

    if (Dealerpoint > Playerpoint) {
      $("#hint").html("莊家較大，你輸了! 失去籌碼!");
      Recording("玩家牌較小，輸了$"+gamebet)
      ShowFinalCard();
      $("#again").html('<button onclick="BacktoBet(0)">好的</button>');

    } else if (Dealerpoint < Playerpoint) {
      $("#hint").html("你較大，你贏了! 資金 +" + gamebet*2 + " !");
      Recording("玩家牌較大，贏了$"+gamebet)
      ShowFinalCard();
      $("#again").html('<button onclick="BacktoBet(' + gamebet*2 + ')">好的</button>');

    } else {
      $("#hint").html("雙方大小一樣，平手! 歸還籌碼，資金 +" + gamebet + " !");
      Recording("雙方大小一樣平手")
      ShowFinalCard();
      $("#again").html('<button onclick="BacktoBet(' + gamebet + ')">好的</button>');
    }
  }
}


//莊家抓牌
function Dealer(){
  ({cardcolor,cardnumber} = DrawCard("dealercards")); //抓牌並顯示

  if (DealerCardSet.length == 1) {
    Recording("莊家拿到第一張牌");
  }else{
    Recording("莊家拿到"+cardcolor+cardnumber);
  }
  
  Dealernumber.push(cardnumber);
  // console.log(Dealernumber)
  CalDealer();  //算莊家牌的分數
}

//玩家抓牌
function Player(justonehit){
  ({cardcolor,cardnumber} = DrawCard("mycards")); //抓牌並顯示
  Recording("玩家拿到"+cardcolor+cardnumber)
  Playernumber.push(cardnumber);
  CalPlayer();  //算玩家牌的分數
  
  setTimeout(function() {
    PlayerCardCondition(justonehit)
  }, 800);
}

function PlayerCardCondition(justonehit) {
  if (Playerpoint1 == 21 || Playerpoint2 == 21) {
    $("#hint").html("你21點，換莊家了!");
    $("#mainbutton").hide();

    setTimeout(function() {
      StandCard();
    }, 1200);

  } else if (Playerpoint2 > 21) {
    $("#hint").html("你爆牌，你輸了! 失去籌碼!");
    Recording("我爆牌，輸了$" + gamebet);
    $("#mainbutton").hide();
    ShowFinalCard();
    $("#again").html("<button onclick='BacktoBet(0)'>好的</button>");

  } else if (justonehit == 1) {
    justonehit = 0;
    $("#hint").html("已加注並拿牌，換莊家了!");
    $("#mainbutton").hide();
    setTimeout(function() {
      StandCard();
    }, 1000);
  }
}


//結算並回到下注畫面
function BacktoBet(betchange){
  $("#intial, #gameUI").hide();
  $("#chipUI, #chipimg, #placebet, #hint, #main").show();
  $("#dealercheat, #playercheat").prop("disabled", false);
  
  bet = 0;
  $("#mychips").text(bet);
  money += betchange; //要算輸贏
  $("#money").text(money);

  //存資料並重排
  Recording("完成一局，目前資金: $" +money);
  MainStorage(newplayerName,money);
  Rank();

  //重置分數
  Dealerpoint1=0; //A算11的狀況
  Dealerpoint2=0; //A算1的狀況
  Playerpoint1=0; //A算11的狀況
  Playerpoint2=0; //A算1的狀況
  Dealernumber=[];
  Playernumber=[];
  DealerCardSet=[];
  PlayerCardSet=[]

  //關閉21點介面並重製
  $("#dealerpoint, #mypoint, #secondpoint").text("");
  $("#dealercards, #mycards, #again").empty();
  //重置牌桌，把之前弄消失的叫回來
  $("#mainbutton, #Hit, #Stand").show();
  $("#hint").text("再來一局，請下注!");

  //破產條件
  if(money < 10 ){
    if (money == 0) {
      Recording("破產");
      $("#hint").html("你已破產，請離開賭場!或按開新遊戲重新開始!<br>也可選擇向此帳號匯錢以續關: 123454875278");
    }else{
      Recording("破產");
      $("#hint").html("你已買不起籌碼，請離開賭場!或按開新遊戲重新開始!<br>也可選擇向此帳號匯錢以續關: 123454875278");
    }

    //不給再來，把東西都關了
    $("#again, #chipUI, #moneyUI").empty();
    //crying banana cat彩蛋
    $("#egg").html("<img src='./banana-crying-cat.gif'>");
  }
}


//算莊家牌分數
function CalDealer(){
  Dealerpoint1 = 0;
  Dealerpoint2 = 0;
  if (Dealernumber.includes(1)) {
    for(var i = 0; i < Dealernumber.length ; ++i){

      if (Dealernumber[i] == 1) {
        Dealerpoint1+=11;
        Dealerpoint2+=1;
      }else if(Dealernumber[i] >= 10){
        Dealerpoint1+=10;
        Dealerpoint2+=10;
      }else{
        Dealerpoint1+=Dealernumber[i];
        Dealerpoint2+=Dealernumber[i];
      }
    }
  }else{
    for(var i = 0; i < Dealernumber.length ; ++i){

      if (Dealernumber[i] == 1) {
        Dealerpoint2+=1;
      }else if(Dealernumber[i] >=10){
        Dealerpoint2+=10;
      }else{
        Dealerpoint2+=Dealernumber[i];
      }
    }
  }

  //顯示莊家點數，若玩家作弊開啟能看到
  if (playercheatcheck == 1) {
    if (Dealerpoint1 != 0 && Dealerpoint1 < 21) {
      $("#dealerpoint").html("點數: " + Dealerpoint1 + " 或 " + Dealerpoint2);
    } else if (Dealerpoint1 == 21) {
      $("#dealerpoint").html("點數: " + Dealerpoint1);
    } else {
      $("#dealerpoint").html("點數: " + Dealerpoint2);
    }
  }  

}

//算玩家牌分數，預設位置是正常位，有分牌會換位置
function CalPlayer(whosepoint = "mypoint"){
  Playerpoint1 = 0;
  Playerpoint2 = 0;
  if (Playernumber.includes(1)) {
    for(var i = 0; i < Playernumber.length ; ++i){

      if (Playernumber[i] == 1) {
        Playerpoint1+=11;
        Playerpoint2+=1;
      }else if(Playernumber[i] >= 10){
        Playerpoint1+=10;
        Playerpoint2+=10;
      }else{
        Playerpoint1+=Playernumber[i];
        Playerpoint2+=Playernumber[i];
      }
    }

  }else{
    for(var i = 0; i < Playernumber.length ; ++i){

      if (Playernumber[i] == 1) {
        Playerpoint2+=1;
      }else if(Playernumber[i] >=10){
        Playerpoint2+=10;
      }else{
        Playerpoint2+=Playernumber[i];
      }
    }
  }
  //處理兩個A出現的問題
  if (Playernumber.indexOf(1) !== -1 && Playernumber.indexOf(1, Playernumber.indexOf(1) + 1) !== -1) {
    // console.log("數組中出現了兩個1");
    Playerpoint1 -= 10; //因為兩個A爆牌就不看了
  }
  
  //試試jQuery另一種寫法
  if(Playerpoint1 !=0 && Playerpoint1 < 21){
    $(`#${whosepoint}`).html(`${Playerpoint1} or ${Playerpoint2}`);
    Recording(`玩家點數: ${Playerpoint1} 或 ${Playerpoint2}`);
  }else if(Playerpoint1 == 21){
    $(`#${whosepoint}`).html(`${Playerpoint1}`);
    Recording(`玩家點數: ${Playerpoint1}`);
  }else{
    $(`#${whosepoint}`).html(`${Playerpoint2}`);
    Recording(`玩家點數: ${Playerpoint2}`);
  }
  
}

// var check = 0 ;
//抽牌並得到花色與數字
function DrawCard(whosecard)
{
  // check++;
  len = Cards.length - 1    //牌堆總共幾張，扣掉index=0的undefine
  
  if(len == 0){   //重新取牌  
    getCards()
    len = Cards.length - 1 
    alert("四副撲克牌已被抽光，正在重新洗牌，請繼續遊玩！");
  }

  //作弊模式條件
  var testDealerpoint = Dealerpoint1 > Dealerpoint2 ? Dealerpoint1 : Dealerpoint2;
  if(dealercheatcheck==1 && DealerCardSet.length >= 2 && whosecard == "dealercards" && testDealerpoint > 10 && testDealerpoint!=21){

    // 作弊抽牌，強制21點
    var testcardnumber = 0;
    targetnumber = 21 - testDealerpoint;
    var localcount = 0;
    while(testcardnumber != targetnumber){
      localcount++;
      number = Math.floor(  1 + Math.random() * len );
      testcard = Cards[number];
      var regex = /id='(\w+)'/; 
      var match = testcard.match(regex); 
      var id = match[1]; // ID內容
      testcardnumber = parseInt(id.match(/\d+/g)[0]); // 得到數字
      //怕牌堆已經沒有需要的牌了，會無限迴圈
      if (localcount == 30) {
        break;
      }
    }
    removed = Cards.splice(number, 1); //移除作弊那張牌
    $("#" + whosecard).append(removed); //丟到螢幕上
  
  }else{
    // 正常的隨機抽牌
    number = Math.floor(1 + Math.random() * len);
    removed = Cards.splice(number, 1); //移除抽到的牌
    $("#" + whosecard).append(removed); //丟到螢幕上
  }




  //專為split服務，把出現過的玩家卡圖片存起來
  if (whosecard == "mycards"){
    PlayerCardSet.push(removed);
  }

  if (whosecard == "dealercards"){
    DealerCardSet.push(removed);
  }


  //取抽到的花色和數字
  var imgElement = $("#" + whosecard + " img:last"); //取最後面的圖片的物件，超方便
  var imgID = imgElement.attr("id"); //取ID

  //分解ID拿撲克牌資訊
  cardcolor = imgID.match(/[a-zA-Z]+/g)[0]; // 抓文字，match返回是list
  cardnumber = imgID.match(/\d+/g)[0]; // 抓數字

  //莊家第一張是卡背
  if (DealerCardSet.length == 1 && whosecard == "dealercards") {
    dealerfirstcardID = imgID;
    $("#dealercards").html(backpokercard);
  }
  
  //傳到算21點的程式裡面
  return{cardcolor:cardcolor, cardnumber:parseInt(cardnumber) }
}

var dealerfirstcardID="";
//把莊家的第一張牌翻過來
function ShowFinalCard(){
  $("#dealercards").html("");
  for (var i in DealerCardSet) {
    $("#dealercards").append(DealerCardSet[i]);
  }
  Recording("莊家翻開第一張牌為"+dealerfirstcardID);
  dealerfirstcardID = "";
  //遊戲結束顯示莊家點數
  if(Dealerpoint1 !=0 && Dealerpoint1 < 21){
    $("#dealerpoint").html("點數: "+Dealerpoint1 +" 或 " + Dealerpoint2);
    Recording("莊家點數: "+Dealerpoint1 +" 或 " + Dealerpoint2)
  }else if(Dealerpoint1 == 21){
    $("#dealerpoint").html("點數: "+Dealerpoint1);
    Recording("莊家點數: "+Dealerpoint1)
  }else{
    $("#dealerpoint").html("點數: "+Dealerpoint2);
    Recording("莊家點數: " + Dealerpoint2)
  }
}


