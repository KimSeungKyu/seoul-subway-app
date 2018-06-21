var UI = require('ui');
var ajax = require('ajax');
var Settings = require('settings');
var Vector2 = require('vector2');
var Accel = require('ui/accel');
var Vibe = require('ui/vibe');

// Prepare the accelerometer
Accel.init();

var isColor = false;
if(Pebble.getActiveWatchInfo){
	var watch = Pebble.getActiveWatchInfo();
	if(watch.platform === 'basalt' || watch.platform === 'chalk'){
		isColor = true;
	}
}

var menu;
var map = Settings.data().subwayData;
//console.log('map:'+map);
if(map !== undefined && map.length > 0){
	var items = [];
	for(var i = 0; i < map.length; i++){
		items[i] = {
			title: map[i][0],
			subtitle: getLine(map[i][2]),
			icon: "IMAGES_LINE_"+map[i][2]+"_PNG"
		};
	}

	menu = new UI.Menu({
		sections: [{
			items: items
		}]
	});
	menu.on('select', function(e) {
		//console.log('Selected item #' + e.itemIndex + ' of section #' + e.sectionIndex);
		//console.log('The item is titled "' + e.item.title + '"');
		showDetailWindow(e.itemIndex);
	});
	menu.show();
}else{
	var card = new UI.Card({
		title: '알림!',
		body: '지금 아무것도 없습니다. 설정을 먼저 역들을 추가해 주세요.'
	});
	card.show();
}

function showDetailWindow(i){
	var subwayId = map[i][2];
	var detailView = new UI.Window({
		scrollable: false,
		fullscreen: true,
		backgroundColor: 'white'
	});
	
	//열차 선로 이미지
	detailView.add(new UI.Image({
		position: new Vector2(0, 106),
		size: new Vector2(144, 42),
		image: 'IMAGES_LINE_GRAPHIC_PNG'
	}));
	
	var nextStation = [];
	for(var n = 0; n < 2; n++){
		nextStation[n] =	new UI.Text({
			position: new Vector2(0, 50),
			size: new Vector2(144 / 2, 24),
			font: 'gothic-18',
			color: 'black',
			textOverflow: 'ellipsis',
			textAlign: 'center',
			backgroundColor: isColor ? 'lightGray' : 'white'
		});
		detailView.add(nextStation[n]);
	}
	
	var arrive = [];
	var train = [];
	for(var a = 0; a < 4; a++){
		arrive[a] = new UI.Text({
			position: new Vector2(2, 74 + (a % 2 === 0 ? 0 : 16)),
			size: new Vector2(140, 16),
			text: '',
			font: 'gothic-14',
			color: 'black',
			textOverflow: 'ellipsis',
			backgroundColor: 'clear',
			textAlign: 'left'
		});
		detailView.add(arrive[a]);

		train[a] = new UI.Image({
			position: new Vector2(-24, -11),
			size: new Vector2(24, 11),
			image: 'IMAGES_TRAIN_PNG'
		});
		detailView.add(train[a]);
	}

	var loading = new UI.Text({
		position: new Vector2(0, 50),
		size: new Vector2(144, 98),
		text: '\nLoading',
		font: 'gothic-24-bold',
		color: 'white',
		textOverflow: 'wrap',
		textAlign: 'center',
		backgroundColor: 'black'
	});
	detailView.add(loading);

	var prev = new UI.Text({
		position: new Vector2(0, 0),
		size: new Vector2(144, 20),
		font: 'gothic-14',
		color: 'black',
		textOverflow: 'ellipsis',
		textAlign: 'center',
		backgroundColor: 'white'
	});
	detailView.add(prev);
	
	var next = new UI.Text({
		position: new Vector2(0, 148),
		size: new Vector2(144, 20),
		font: 'gothic-14',
		color: 'black',
		textOverflow: 'ellipsis',
		textAlign: 'center',
		backgroundColor: 'white'
	});
	detailView.add(next);
	
	var station = new UI.Text({
		position: new Vector2(0, 20),
		size: new Vector2(144, 30),
		font: 'gothic-24-bold',
		color: isColor ? getLineTextColor(subwayId) : 'white',
		textOverflow: 'ellipsis',
		textAlign: 'center',
		backgroundColor: isColor ? getLineColor(subwayId) : 'black'
	});
	detailView.add(station);
	
	detailView.on('click', 'select', function(e) {
		splashLoading(loading);
		processing(i, detailView, station, next, prev, loading, nextStation, arrive, train);
	});
	detailView.on('click', 'up', function(e) {
		if(i > 0){
			i -= 1;
			initTrainPosition(train);
			splashLoading(loading);
			processing(i, detailView, station, next, prev, loading, nextStation, arrive, train);
		}else{
			Vibe.vibrate('double');
		}
	});
	detailView.on('click', 'down', function(e) {
		if(i < map.length - 1){
			i += 1;
			initTrainPosition(train);
			splashLoading(loading);
			processing(i, detailView, station, next, prev, loading, nextStation, arrive, train);
		}else{
			Vibe.vibrate('double');
		}
	});
	detailView.show();
	processing(i, detailView, station, next, prev, loading, nextStation, arrive, train);
}

function processing(i, detailView, station, next, prev, loading, nextStation, arrive, train){
	var name = map[i][0];
	var statnId = map[i][1];
	var subwayId = map[i][2];
	
	station.text(name);
	station.color(isColor ? getLineTextColor(subwayId) : 'white');
	station.backgroundColor(isColor ? getLineColor(subwayId) : 'black');
	
	if(i > 0){
		prev.text(map[i - 1][0]);
		prev.color(isColor ? getLineTextColor(map[i - 1][2]) : 'black');
		prev.backgroundColor(isColor ? getLineColor(map[i - 1][2]) : 'white');
	}else{
		prev.text('X');
		prev.color('white');
		prev.backgroundColor('black');
	}
	if(i < map.length - 1){
		next.text(map[i + 1][0]);
		next.color(isColor ? getLineTextColor(map[i + 1][2]) : 'black');
		next.backgroundColor(isColor ? getLineColor(map[i + 1][2]) : 'white');
	}else{
		next.text('X');
		next.color('white');
		next.backgroundColor('black');
	}
	
	for(var n = 0; n < 2; n++){
		nextStation[n].text('');
	}
	for(var a = 0; a < 4; a++){
		arrive[a].text('');
	}
	
	ajax({
		url : "http://m.bus.go.kr/mBus/subway/getArvlByInfo.bms",
		method : 'post',
		type : 'TEXT',
		async: true,
		data : { "subwayId" : subwayId, "statnId" : statnId }
		},
		function(data, status, request) {
			try{
				console.log('성공: ' + data);
				data = "{" + data.substring(data.indexOf('resultList2') - 1, data.length);
				data = JSON.parse(data);
				console.log('substring: ' + data);

				if(data.resultList === null){
					//막차 이후여서 차가 없을 경우
					loading.text('\n운행이 없습니다.');
					Vibe.vibrate('double');
				}else{
					loading.animate('position', new Vector2(0, 148), 200);
					
					var limit = 0;
					var index = 0;
					var x = 0;
					var y = 70;
					for(var i = 0; i < data.resultList.length; i++){
						var item = data.resultList[i];
						console.log(i + ': ' + JSON.stringify(item));
						var textAlign = getUpDownLineToAlign(item.updnLine);
						var leftSide = textAlign === 'left' ? true : false;
						if(i > 0 && item.updnLine !== data.resultList[i - 1].updnLine){
							limit = 0;
						}
						if(limit >= 2) continue;

						if(leftSide){
							x = 0;
						}else{
							x = 144 / 2;
						}

						if(i === 0 || (i > 0 && data.resultList[i - 1].cStatnNm !== item.cStatnNm)){
							y = 70;
							var nextStationIndex = leftSide ? 0 : 1;
							nextStation[nextStationIndex].position().x = x;
							nextStation[nextStationIndex].text(item.cStatnNm.substring(0, item.cStatnNm.length - 2));
						}

						var curstatnsn = item.curstatnsn;
						var arriveText = item.arvlMsg2;
						var rapid = '';
						var final = '';
						if(item.trainLineNm.indexOf('(급행)') > -1){
							rapid = '.급';
						}
						if(item.trainLineNm.indexOf('(막차)') > -1){
							final = '.막';
						}
						if(arriveText.indexOf(' (') > -1){
							arriveText = arriveText.substring(0, arriveText.indexOf(' ('));
						}

						switch(curstatnsn){
							case '0':
								arriveText = '당역' + getDepartArrive(data.resultList[i].arvlCd);
								break;
							case '1':
								arriveText = '전역' + getDepartArrive(data.resultList[i].arvlCd);
								break;
							case '2':
								arriveText = '전전역';
								break;
							default:
								arriveText = curstatnsn + '개역전';
						}
						arriveText = arriveText + rapid + final;

						arrive[index].position(new Vector2(2, y));
						arrive[index].text(arriveText);
						arrive[index].textAlign(textAlign);
						y += 16;

						//열차 위치 표시
						//console.log('curstatnsn: '+curstatnsn+', updnLine: '+data.resultList[i].updnLine);
						if(curstatnsn > 2){
							train[index].position(new Vector2(leftSide ? 144 : -24, 106 + (leftSide ? 7 : 28)));
						}else{
							switch(curstatnsn){
								case '0': x = 14; break;
								case '1': x = 72; break;
								case '2': x = 130; break;
								default: x = 0;
							}
							if(leftSide){
								x -= 12;
							}else{
								x = 144 - x - 12;
							}

							if(curstatnsn < 2){
								if(data.resultList[i].arvlCd === '0' || data.resultList[i].arvlCd === '4'){
									//진입
									if(leftSide){
										x += 12;
									}else{
										x -= 12;
									}
								}else if(data.resultList[i].arvlCd === '2' || data.resultList[i].arvlCd === '3'){
									//출발
									if(leftSide){
										x -= 12;
									}else{
										x += 12;
									}
								}
							}

							if(leftSide){
								if(train[index].position().x < x){
									train[index].position(new Vector2(leftSide ? 144 : -24, 106 + (leftSide ? 7 : 28)));
								}else{
									train[index].position(new Vector2(train[index].position().x, 106 + (leftSide ? 7 : 28)));
								}
							}else{
								if(train[index].position().x > x){
									train[index].position(new Vector2(leftSide ? 144 : -24, 106 + (leftSide ? 7 : 28)));
								}else{
									train[index].position(new Vector2(train[index].position().x, 106 + (leftSide ? 7 : 28)));
								}
							}
							var pos = train[index].position();
							pos.x = x;
							train[index].animate('position', pos, 800);
						}
						limit++;
						index++;
					}
					Vibe.vibrate('short');
				}
			}catch(e){
				fail(e, loading);
			}
		},
		function(error, status, request) {
			fail(error, loading);
		}
	);
}

function splashLoading(loading){
	loading.text('\n연결중입니다.');
	loading.font('gothic-24-bold');
	loading.textAlign('center');
	if(loading.position().y !== 50){
		loading.animate('position', new Vector2(0, 50), 200);
	}
}
function initTrainPosition(train){
	for(var a = 0; a < 4; a++){
		train[a].position().x = -24;
		train[a].position().y = -11;
	}
}

function fail(e, loading){
	console.log('에러: '+e);
	loading.text('실패!\n다시 시도해주세요.');
	Vibe.vibrate('double');
}

function getDepartArrive(arvlCd){
	if(arvlCd === '0' || arvlCd === '4'){
		//진입
		return '진입';
	}else if(arvlCd === '2' || arvlCd === '3'){
		//출발
		return '출발';
	}else{
		return '도착';
	}
}

function getUpDownLineToAlign(updnLine){
	switch(updnLine){
		case '상행':
		case '내선':
			return 'right';
		case '하행':
		case '외선':
			return 'left';
	}
}

//호선명
function getLine(subwayId) {
	var returnValue = '';
	if(subwayId == '1001') {
		returnValue = '1호선';
	} else if(subwayId == '1002') {
		returnValue = '2호선';
	} else if(subwayId == '1003') {
		returnValue = '3호선';
	} else if(subwayId == '1004') {
		returnValue = '4호선';
	} else if(subwayId == '1005') {
		returnValue = '5호선';
	} else if(subwayId == '1006') {
		returnValue = '6호선';
	} else if(subwayId == '1007') {
		returnValue = '7호선';
	} else if(subwayId == '1008') {
		returnValue = '8호선';
	} else if(subwayId == '1009') {
		returnValue = '9호선';
	} else if(subwayId == '1063') {
		returnValue = '경의중앙';
	} else if(subwayId == '1065') {
		returnValue = '공항철도';
	} else if(subwayId == '1067') {
		returnValue = '경춘선';
	} else if(subwayId == '1069') {
		returnValue = '인천1호선';
	} else if(subwayId == '1071') {
		returnValue = '수인선';
	} else if(subwayId == '1075') {
		returnValue = '분당선';
	} else if(subwayId == '1077') {
		returnValue = '신분당선';
	}
	return returnValue;
}

function getLineColor(subwayId) {
	var returnValue = '';
	if(subwayId == '1001') {
		returnValue = 'dukeBlue';
	} else if(subwayId == '1002') {
		returnValue = 'islamicGreen';
	} else if(subwayId == '1003') {
		returnValue = 'chromeYellow';
	} else if(subwayId == '1004') {
		returnValue = 'pictonBlue';
	} else if(subwayId == '1005') {
		returnValue = 'purple';
	} else if(subwayId == '1006') {
		returnValue = 'windsorTan';
	} else if(subwayId == '1007') {
		returnValue = 'darkGreen';
	} else if(subwayId == '1008') {
		returnValue = 'brilliantRose';
	} else if(subwayId == '1009') {
		returnValue = 'limerick';
	} else if(subwayId == '1063') {
		returnValue = 'cadetBlue';
	} else if(subwayId == '1065') {
		returnValue = 'babyBlueEyes';
	} else if(subwayId == '1067') {
		returnValue = 'tiffanyBlue';
	} else if(subwayId == '1069') {
		returnValue = 'cobaltBlue';
	} else if(subwayId == '1071') {
		returnValue = 'rajah';
	} else if(subwayId == '1075') {
		returnValue = 'yellow';
	} else if(subwayId == '1077') {
		returnValue = 'darkCandyAppleRed';
	}
	return returnValue;
}

function getLineTextColor(subwayId) {
	var returnValue = '';
	if(subwayId == '1001') {
		returnValue = 'white';
	} else if(subwayId == '1002') {
		returnValue = 'white';
	} else if(subwayId == '1003') {
		returnValue = 'white';
	} else if(subwayId == '1004') {
		returnValue = 'white';
	} else if(subwayId == '1005') {
		returnValue = 'white';
	} else if(subwayId == '1006') {
		returnValue = 'white';
	} else if(subwayId == '1007') {
		returnValue = 'white';
	} else if(subwayId == '1008') {
		returnValue = 'black';
	} else if(subwayId == '1009') {
		returnValue = 'white';
	} else if(subwayId == '1063') {
		returnValue = 'black';
	} else if(subwayId == '1065') {
		returnValue = 'black';
	} else if(subwayId == '1067') {
		returnValue = 'white';
	} else if(subwayId == '1069') {
		returnValue = 'white';
	} else if(subwayId == '1071') {
		returnValue = 'black';
	} else if(subwayId == '1075') {
		returnValue = 'black';
	} else if(subwayId == '1077') {
		returnValue = 'white';
	}
	return returnValue;
}

// 설정
Settings.config(
	{ url: "Your server address/subway/subway-config.html" },
  function(e) {
    console.log('closed configurable');
		
		// 설정 저장이 실패일 경우
    if (e.failed) {
      console.log(e.response);
    }else{
			//정상일 경우
			var configuration = JSON.parse(decodeURIComponent(e.response));
			Settings.data(configuration);
			//console.log('save data: '+JSON.stringify(configuration.busData));
			
			//메뉴 아이템 새로만듦
			menu.items(0, []);
			map = Settings.data().subwayData;
			for(var i = 0; i < map.length; i++){
				menu.item(0, i, {
					title: map[i][0],
					subtitle: getLine(map[i][2]),
					icon: getImage(map[i][2])
				});
			}
		}
  }
);