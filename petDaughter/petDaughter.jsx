// petDaughter　2025.07.03- （z-）
// https://ajabon.catfood.jp
// 箱入り娘ってやつです。赤いでかいのを外に出すパズル。
// ［クリック、矢印キー］は上>下>左>右 で動きます　shiftキー併用で優先度反転。
// マウスドラッグでも遊戯可。
// 
// どこか引用・流用される場合はよしなに尊重してください。

// level: むずさ　　W, H: アイコンボタンの配置コマ数　　targetYX: マウスボタンを押したコマ座標　　mouseOn: マウスボタン押下のboolean　　isClicking:  クリック中の作業なのか
var level, W = 4, H = 6, targetY, targetX, mouseOn = false, isClicking = false;
// iconFolder: アイコンデータフォルダのパス　　iconStr: アイコンファイルの共通パス　　win: ダイアログ　　stage: コマの有無をビットで表すステージ
var iconFolder, iconStr, win, stage = 0;
// pieces: コマのビット情報　　piece: 移動対象のコマ　　nextPosition: 移動先のコマ座標　　pieceIndex: コマの要素番号
var pieces, piece, nextPosition, pieceIndex;
// カベ
var wall_up = parseInt("11110000000000000000", 2), wall_down = parseInt("1111", 2), 
	wall_left = parseInt("10001000100010001000", 2), wall_right = parseInt("00010001000100010001", 2);
// レベルごとのコマ情報　ブランク:_  1x1:o  2x1:^u  1x2:<>  2x2:abcd
var allPieces = [
	["^ab^", "ucdu", "^oo^", "uoou", "o__o", "=ex="], 
	["^ab^", "ucdu", "<><>", "<><>", "o__o", "=ex="], 
	["^ab^", "ucdu", "oooo", "<><>", "o__o", "=ex="], 
	["^ab^", "ucdu", "<><>", "oooo", "o__o", "=ex="], 
	["^ab^", "ucdu", "^<>^", "uoou", "o__o", "=ex="], 
	["^ab^", "ucdu", "<><>", "o<>o", "o__o", "=ex="]
];
// アイコンファイル名の配列
var iconMarkStr = ["o",   "^",     "u",     "<",     ">",     "a",     "b",     "c",     "d",     "_",     "=",    "e",      "x"].join("");
var iconNameAry = ["1x1", "2x1_0", "2x1_1", "1x2_0", "1x2_1", "2x2_0", "2x2_1", "2x2_2", "2x2_3", "blank", "wall", "exit_0", "exit_1"];


function main(){
	// アイコンフォルダの確認
	iconFolder = new Folder("~/desktop/petDaughter");
	if(iconFolder.exists == false){
		alert("動作に必要なフォルダー「petDaughter」をデスクトップに置いてください");
		return;
	}
	// アイコンファイルパスの共通部分
	iconStr = iconFolder.fsName + "/pd_icon_";

	// レベル（難易度）をえらぶダイアログ
	var lvDlg = new Window("dialog{text:'むずさ', orientation:'row', D:DropDownList{size:[60,20]}, \
	B:Button{text:'start job', properties:{name:'ok'}}}");
	for(var i = 1; i <= 6; i++){
		lvDlg.D.add("item", i + "");
	}
	lvDlg.D.selection = 1;
	lvDlg.onClose = function(){
		level = lvDlg.D.selection.text - 0;
	}
	if(lvDlg.show() != 1) return;

	// var level = 1; //test
	// levelに応じたコマ配置の読み込み
	var iconDefault = [], pieceData = allPieces[level - 1], chr, rowIcons, pieceName, num;
	pieces = [];
	for(var i = 0; i < 6; i++){
		rowIcons = [];
		for(var j = 0; j < 4; j++){
			// アイコンファイル名
			chr = pieceData[i].substr(j, 1);
			pieceName = iconNameAry[iconMarkStr.indexOf(chr)]
			rowIcons.push(pieceName);
			// コマのビットマップ
			num = pieceName.match(/\d/g);
			if(num == null) { continue; }
			if(num.length < 2) {  continue; }
			if(num.length == 2) { setBitMap(num, i, j); continue; }
			if(num[2] == "0") { setBitMap(num, i, j); continue; }
		}
		iconDefault.push(rowIcons);
	}

	function setBitMap(ary, i, j){
		var str, bitStr = "";
		while(i){ bitStr += "0000"; i--;}
		while(j){ bitStr += "0"; j--;}
		for(var y = 0; y < ary[0]; y++){
			str = "";
			for(var x = 0; x < ary[1]; x++){
				str += "1";
			}
			bitStr += (str + "000").slice(0, 4);
		}
		pieces.push((bitStr + "0000000000000000").slice(0, 20));
	}

	// ステージ（コマのあるなしマップ）
	for(pieceIndex = 0; pieceIndex < pieces.length; pieceIndex++){
		stage = stage | parseInt(pieces[pieceIndex], 2);
	}

	var dlg = "dialog{orientation:'column', spacing:0, margins:[4,4,4,4], ";
	for(var i = 0; i < H; i++){
		dlg += "G" + i + ":Group{orientation:'row', spacing:0, margins:[0,0,0,0]";
		for(var j = 0; j < W; j++){
			dlg += "B" + j + ":IconButton{size:[15,15], icon:'" + iconStr + iconDefault[i][j] + ".png', Y:" + i + ", X:" + j + "},";
		}
		dlg += "}";
	}
	dlg += "}";

	win = new Window(dlg);

	// マウスで何かしたとき
	for(i = 0; i < H; i++){
		for(j = 0; j < W; j++){
			wc(i, j).addEventListener("mousedown", function(e){
				getTarget(e.target.Y, e.target.X);
				isClicking = true;
			});
			wc(i, j).addEventListener("mouseup", function(e){
				if(mouseOn && isClicking　&& e.target.Y == targetY && e.target.X == targetX){
					moveFunc();
				}
				mouseOn = false;
				isClicking = false;
				targetY = undefined;
				targetX = undefined;
			});
			wc(i, j).addEventListener("mousemove", function(e){
				if(mouseOn){
					mouseMove(e.target.Y, e.target.X);
				}
			});
		}
	}

	// キー入力
	win.addEventListener ("keydown", function(e){
		keyMoveFunc(e.keyName); // Up, Down, Left, Right
		e.preventDefault();
	});
	
	wc(0, 0).active = true;
	win.show();
}

main();

/////////////////////　関数　/////////////////////////

// 確認用
function cp(mes){
	// alert(mes);
	// $.writeln(mes);
	}

// ムスメ出たか
function isGoal(val){
	if((val >= 4 && pieceIndex == 1) || val == "Down"){
		if(pieces[1].slice(-3) == "110"){
			win.close();
			alert("やったーやったー");
			return true;
		}
	}
}

// 20ビットにととのえる
function adjustDigits(str){
	return ("00000000000000000000" + str).slice(-20);
}

// ボタン配列の要素をラクに呼ぶ関数
function wc(y, x){
	try{
		return win.children[y].children[x];
	} catch(e){
		cp("wc error y=" + y + " x=" + x);
		return null;
	}
}


// 矢印キーによる操作
function keyMoveFunc(keyName){
	// 早々のムスメ調査
	if(isGoal(keyName)) return;

	var tg;
	// tg: ステージ上のブランク座標をシフト補正したもの（先頭の0が削られた分はここで補完）
	switch(keyName){
		case "Up":		tg = ("0000" + (stage >> 4).toString(2)).slice(-16); break;
		case "Down": 	tg = ("0000" + (stage << 4 | parseInt("1111", 2)).toString(2)).slice(-16); break;
		case "Left": 	tg = ("0000" + (stage >> 1).toString(2)).slice(-16); break;
		case "Right": 	tg = ("0000" + (stage << 1 | parseInt("1", 2)).toString(2)).slice(-16); break;
		default: return;
	}
	cp("keyName: " + keyName);
	cp("stage: " + stage.toString(2));
	cp("tg: " + tg);
	// shiftキーが押されているか
	var isShiftKey = ScriptUI.environment.keyboardState.shiftKey;
	// 補正後ステージを20ビットにととのえ
	var stageStr = ("1111" + tg).slice(-20);
	cp("stageStr: " + stageStr);
	// 補正後ステージにブランクがなければ何もしない
	if(/0/.test(stageStr) == false) return;
	// 補正後の0の位置 === ブランクへ移動できるマスの位置 ブランクは2個ある
	var pos = [stageStr.indexOf("0"), stageStr.lastIndexOf("0")];
	// shiftキーの有無で片方を移動　条件外ならもう片方を移動
	cp("pos: " + pos);
	if(moveFunc(pos[isShiftKey? 1 : 0], keyName) == false){
		moveFunc(pos[1], keyName);
	}
}

// クリックした隣（上下左右）にブランクがあれば移動
function moveFunc(pos, keyName){
	if(pos == undefined){
		pos = targetY * 4 + targetX;
		var isShiftKey = ScriptUI.environment.keyboardState.shiftKey;
	}
	// コマの特定　piece: 対象のコマ　direction: 向き
	var piece = undefined, direction = [];
	// 移動元のコマを特定する
	for(pieceIndex = 0; pieceIndex < pieces.length; pieceIndex++){
		if(pieces[pieceIndex].substr(pos, 1) == "1"){
			piece = parseInt(pieces[pieceIndex], 2);
			break;
		}
	}
	// 合致するコマなし（ブランク）
	if(piece == undefined){
		return false;
	}
cp("piece: " + pieces[pieceIndex]);
	// 移動先のブランクマス調査
	isWall(wall_up, piece << 4, "Up");
	isWall(wall_down, piece >> 4, "Down");
	isWall(wall_left, piece << 1, "Left");
	isWall(wall_right, piece >> 1, "Right");

	// 動かせるアキなし
	if(!direction.length) return false;

	// 移動可能方向の数とshiftキーの有無で方向をきめる
	direction = (direction.length == 1 || isShiftKey == false)? direction[0] : direction[1];

	// コマ座標の移動 20ビットにととのえる
	switch(direction){
		case "Up": 	 pieces[pieceIndex] = adjustDigits((piece << 4).toString(2)); break;
		case "Down": pieces[pieceIndex] = adjustDigits((piece >> 4).toString(2)); break;
		case "Left": pieces[pieceIndex] = adjustDigits((piece << 1).toString(2)); break;
		case "Right":pieces[pieceIndex] = adjustDigits((piece >> 1).toString(2));
	}
cp("new pieces[pieceIndex]: " + pieces[pieceIndex]);
	// コマのアイコン入れ替え
	switchIcons(adjustDigits(piece.toString(2)), pieces[pieceIndex]);

	// ステージ更新
	stage = stage ^ piece | parseInt(pieces[pieceIndex], 2);
cp("new stage: " + stage.toString(2));
	// 移動後のコマの座標と ステージから自身の移動前座標を消したもの　で衝突判定、衝突なしなら向きを返す
	function isWall(wall, neb, str){
		if((piece & wall) == 0 && (neb & (stage ^ piece)) == 0){
			if(keyName && keyName != str){
				return;
			} 
			direction.push(str);
		}
	}
}


// コマのアイコン入れ替え
function switchIcons(before, after){
	cp("before:" + before + "   after:" + after);
	// iconsTemp: 一時記憶用, firstPart: 1マスめ（左上）, lastPart: 2マスめ（右下）
	var iconsTemp = [], firstPart, lastPart, yAry = [], xAry = [];
	// before座標のアイコン取得
	getPosition(before);
	for(var i = 0; i < yAry.length; i++){
		for(var j = 0; j < xAry.length; j++){
			iconsTemp.push(wc(yAry[i], xAry[j]).icon.name);
		}
	}
	// after座標にアイコン適用
	getPosition(after);
	for(i = 0; i < yAry.length; i++){
		for(j = 0; j < xAry.length; j++){
			wc(yAry[i], xAry[j]).icon = iconsTemp.shift();
		}
	}
	// 元の位置にブランクのアイコン適用
	var newBlank = adjustDigits(((parseInt(before, 2) & ~ parseInt(after, 2)) & stage).toString(2));
	getPosition(newBlank);
	for(var i = 0; i < yAry.length; i++){
		for(var j = 0; j < xAry.length; j++){
			wc(yAry[i], xAry[j]).icon = iconStr + "blank" + ".png";
		}
	}

	// 移動で変動した領域の座標を取得　同じ座標なら配列を省略、動いてればソート
	function getPosition(str){
		cp("getPosition: " + str);
		firstPart = getCoordinates(str.indexOf("1"));
		lastPart = getCoordinates(str.lastIndexOf("1"));
		cp("firstPart:" + firstPart + "  lastPart:" + lastPart);
		yAry = firstPart[0] == lastPart[0]? [firstPart[0]] : [firstPart[0], lastPart[0]].sort();
		xAry = firstPart[1] == lastPart[1]? [firstPart[1]] : [firstPart[1], lastPart[1]].sort();
		cp("yAry:" + yAry + "   xAry:" + xAry);
	}

	// インデックスからYX座標を返す
	function getCoordinates(ind){
		var y = Math.floor(ind / 4);
		var x = ind % 4;
		return [y, x];
	}
}


// マウス押したとき、ターゲットのマスをつかまえる
function getTarget(Y, X){
	// 何番目のマスか
	cp("Y: " + Y + " X: " + X);
	var position = Y * 4 + X;
	cp("position: " + position);
	// 合致するコマを探す
	piece = undefined;
	for(pieceIndex = 0; pieceIndex < pieces.length; pieceIndex++){
		if(pieces[pieceIndex].substr(position, 1) == "1"){
			piece = parseInt(pieces[pieceIndex], 2);
			break;
		}
	}
	cp("piece: " + pieces[pieceIndex]);
	// 合致なし（ブランクマス）
	if(piece == undefined){
		return false;
	}
	// マウスボタン押してるフラグ、移動基点の記録
	mouseOn = true;
	targetY = Y;
	targetX = X;
	cp("piece No.: " + pieceIndex);
	cp("targetY: " + targetY + " targetX: " + targetX);
}

// マウス（押しながら）移動したとき
function mouseMove(Y, X){
	// 移動量が1マス以外は何もしない
	var posDiff_Y = Y - targetY, posDiff_X = X - targetX, nextPositionBit;
	if(Math.abs(posDiff_Y - posDiff_X) != 1) return;
	// 移動先が元位置以外ならクリック中判定は外す
	isClicking = false;

	// 移動後のビットを生成
	nextPosition = ((posDiff_X + posDiff_Y) < 0
		? piece << (posDiff_Y ? 4 : 1)
		: piece >> (posDiff_Y ? 4 : 1))/* & parseInt("11111111111111111111", 2)*/;
	nextPositionBit = nextPosition.toString(2);

	cp("stage: " + stage.toString(2));
	cp("nextPositionBit: " + nextPositionBit);
	// 移動後にステージとかぶってたら何もしない
	cp("piece & nextPosition: " + (piece & nextPosition).toString(2));
	if(nextPositionBit == "0") return; // ステージ外はみだし判定 1
	if(nextPositionBit.length > 20) return; // ステージ外はみだし判定 2
	if(pieces[pieceIndex].match(/1/g).length != nextPositionBit.match(/1/g).length) return; // ステージ外はみだし判定 3
	if((nextPosition & (stage ^ (piece & nextPosition))) != 0) return;

	// 移動基点の更新
	targetY += posDiff_Y;
	targetX += posDiff_X;

	cp("new targetY: " + targetY + " targetX: " + targetX);
	// コマのビット情報を更新
	pieces[pieceIndex] = adjustDigits(nextPositionBit);
	
	// ムスメ調査
	if(isGoal(targetY)) return;
	if(targetY >= 5) return;

	// コマのアイコン入れ替え
	switchIcons(adjustDigits(piece.toString(2)), pieces[pieceIndex]);

	// ステージとコマ情報を更新
	stage = stage ^ piece | nextPosition;
	cp("new stage: " + stage.toString(2));
	piece = nextPosition;
}