/*
 * jquery.zweiChThreadView.js
 * 2ch-HTMLをスレッドビューワーとして見やすく加工するメソッド群
 * 2chブラウザライクな機能を実現するための最低限の実装を提供します
 * 
 * Jsライブラリのため2ch(HTML版)をターゲットとしています
 * 2ch(DAT版)はターゲットとしてないのでDATをHTMLに変換して当ライブラリを使用してください。
 * 当ライブラリは「2chMatometter」という2chまとめ作成ソフトから
 * 汎用的に使用できるメソッドを切り出したものになります。
 * https://sourceforge.jp/projects/j2chmatometter/
 * 
 * @author General BlackBunny (ジェネラル・黒うさぎ twitter:@GeneralBBunny)
 * 
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * Copyright ©2012 GeneralBlackBunny. All Rights Reserved
 * 
 * Ver 0.1 201204XX
 * Ver 0.2 20120610 プラグインとしてコードを整理
 */

/*
 * [基本設計思想]
 * ・パラメーターの保存値は外部JS（このライブラリを使用するJS）側でクッキー等で行う。このライブラリではクッキーを使用しない。
 * ・jQuery以外のライブラリには依存せず単独で動くようにしておく。
 */

// ルートオブジェクトを作成
var zweiChThreadView = {};

//スレッドビューワーからコピーフレームにコピーさせたくないものにHTMLクラスを指定します
//コピーする時に削除
zweiChThreadView.NOTCOPY_MARK = "notCopy2Frame";
//コピーする時に元に戻す
zweiChThreadView.REORIGN_MARK = "reOrigin";

// IDをキーにしたIDが出現したDD項番を格納したMapの配列
zweiChThreadView.idMapList; //初期化&クリアはメソッド内で実施

//IDをキーにしたIDごとの発言数 (id値:レス数)
zweiChThreadView.idMapConuter; //初期化&クリアはメソッド内で実施

// アンカーを誰に貼っているかを格納しているMAP配列
zweiChThreadView.anchorToList; //初期化&クリアはメソッド内で実施

// アンカーが誰から貼られてるかを格納しているMAP配列
zweiChThreadView.anchorFromList; //初期化&クリアはメソッド内で実施

//　レス項番にどれだけアンカーが貼られているかのカウンタ
zweiChThreadView.anchorCounterList; //初期化&クリアはメソッド内で実施

/**
 * 2ch-HTMLのレス数に応じたIDの強調表示をします。
 * またレス数のMAX値と現在値を表示します。
 * 
 * [オプション]
 * jQuery.fn.idCounterView.strongNum = "強調表示するレス数を設定 N以上" (デフォルト <=5)
 * jQuery.fn.idCounterView.dspNowMax = レス数の現在値/レス数のMAX値をHTMLに表示するかの可否 デフォルトfalse)
 * jQuery.fn.idCounterView.color = ID強調表示用のカラー (デフォルトred)
 * 
 * @selecter 2ch-HTML
 */
jQuery.fn.idCounterView = function() {

	//オプション初期処理
	if(!jQuery.fn.idCounterView.strongNum) {
		// IDの強調表示をするレス値
		jQuery.fn.idCounterView.strongNum = 5;
	}
	if(!jQuery.fn.idCounterView.dspNowMax) {
		// レスのNOW/MAXの表示可否
		jQuery.fn.idCounterView.dspNowMax = false;
	}
	if(!jQuery.fn.idCounterView.color) {
		jQuery.fn.idCounterView.color = "red";
	}
	
	// オプションをローカル変数に保持
	var strongNum = jQuery.fn.idCounterView.strongNum;
	var dspNowMax = jQuery.fn.idCounterView.dspNowMax;
	var color = jQuery.fn.idCounterView.color;
	
	// (id値:レス数) 初期化&クリア処理
	zweiChThreadView.idMapConuter = {};
	var id;
	var dtCounter = 1;
	
	// 初期化&クリア処理
	zweiChThreadView.idMapList = {};
	
	var $targets = jQuery(this).find("dt");
	$targets.each(function() {
		
		id = findResId($(this).html());

		// idがない、もしくは???の場合はMAPをつくらない
		if(id !== null){
			// レスカウンターを加算
			if(!zweiChThreadView.idMapConuter[id]) {
				zweiChThreadView.idMapConuter[id] = 0;
			}
			zweiChThreadView.idMapConuter[id]++;
			
			// zweiChThreadView.idMapListを算出
			if(!zweiChThreadView.idMapList[id]){
				zweiChThreadView.idMapList[id] = [];
			}
			zweiChThreadView.idMapList[id].push(dtCounter);
			
		}
		// DOM要素に現在のレス数(NOW)を保存(糞処理が重い)
		//$targets.data("now", idMap[id]);
		
		dtCounter++;
	});
	
	// ■算出したMAP値を元にHTMLを装飾します
	var orign,result;

	// NOW値用のMAP
	var idMap4Now = {};
	$targets.each(function() {
		id = findResId($(this).html());
		
		if(id === null){
			return;
		}
		// NOW/MAX値表示オプションがtrueの時はNOW/MAP値を表示 (強調表示よりも先にする)
		if(dspNowMax) {
			// レスカウンターを加算
			if(!idMap4Now[id]) {
				idMap4Now[id] = 0;
			}
			idMap4Now[id]++;
			
			result = replaceResId(
					$(this).html(),
					"$1 <font class=\"" + zweiChThreadView.NOTCOPY_MARK + "\">" + idMap4Now[id] + "/" + zweiChThreadView.idMapConuter[id] + "</font>");
			// 編集した結果を格納
			$(this).html(result);
		}
		
		// レス数が強調表示値を超えていたら指定色で装飾
		if(strongNum <= zweiChThreadView.idMapConuter[id]) {
			result = replaceResId($(this).html(),"<font color=\""+  color +"\" class=\"" + zweiChThreadView.REORIGN_MARK + "\" >$1</font>");
			// 編集した結果を格納
			$(this).html(result);
		}
	});
	
	return this;
};


//527 ：名無しさん＠ピンキー：2012/05/12(土) 20:56:50.32 ID:nq12gp1h0 3/4
//527 ：名無しさん＠ピンキー：2012/05/12(土) 20:56:50.32 ID:nq12gp1h0 3/4 (>>:10) ・・・>>自体が処理にひっかかる可能性が出てくるので却下
//527 ：名無しさん＠ピンキー：2012/05/12(土) 20:56:50.32 ID:nq12gp1h0 3/4 (AN:10)
/**
 * アンカー強調表示を実行します
 * アンカーレスされたレス番号を色装飾(Bold+指定色)します
 * また指定されたしきい値以上にアンカーレスされたレス番号を強調表示(Bold+指定色)します
 * またDTタグの末尾にアンカーされた数を表示します(指定色)
 * 
 * [オプション]
 * jQuery.fn.resAnchorView.num=しきい値(デフォルト3)
 * jQuery.fn.resAnchorView.normalColor=[通常表示]しきい値を越えてないアンカーの色(デフォルト紫)
 * jQuery.fn.resAnchorView.strongColor=[強調表示]しきい値を超えたアンカーの色(デフォルトred)
 * jQuery.fn.resAnchorView.numDsp =アンカーされた数の表示可否(デフォルト:false)
 * jQuery.fn.resAnchorView.numDspColor = アンカー数の表示色(デフォルト:47ff7f)緑
 * jQuery.fn.resAnchorView.anchorHeader = アンカー表示用の識別ヘッダー (デフォルト："AN:")
 * 
 * @selecter 2ch-HTML
 *　@return this-jQueryObject
 */
jQuery.fn.resAnchorView = function() {
	if(!jQuery.fn.resAnchorView.num){
		jQuery.fn.resAnchorView.num = 3;
	}
	if(!jQuery.fn.resAnchorView.normalColor){
		jQuery.fn.resAnchorView.normalColor = "#f54dfb";
	}
	if(!jQuery.fn.resAnchorView.strongColor){
		jQuery.fn.resAnchorView.strongColor = "red";
	}
	if(!jQuery.fn.resAnchorView.numDsp){
		jQuery.fn.resAnchorView.numDsp = false;
	}
	if(!jQuery.fn.resAnchorView.numDspColor){
		jQuery.fn.resAnchorView.numDspColor = "47ff7f";
	}
	if(!jQuery.fn.resAnchorView.anchorHeader){
		jQuery.fn.resAnchorView.anchorHeader = "AN:";
	}
	// オプションを内部変数に保持
	var num = jQuery.fn.resAnchorView.num;
	var normalColor = jQuery.fn.resAnchorView.normalColor;
	var strongColor = jQuery.fn.resAnchorView.strongColor;
	var numDsp = jQuery.fn.resAnchorView.numDsp;
	var numDspColor = jQuery.fn.resAnchorView.numDspColor;
	var anchorHeader = jQuery.fn.resAnchorView.anchorHeader;
	
	// anchorCounterListとanchorFromListを紐付けて上階層にオブジェクトを作ってもいいが
	// オブジェクトの入れ子よりは今の実装が性能が早いのでそのままにしておく。
	// またカウンタはanchorFromListのlengthを見ればわかるが処理性能を考えてカウンタ用にリストは残しておく
	
	// アンカー数を格納する配列 1・・1001
	var anchorCounterList = {};
	
	// アンカーを誰から(どのレス番号が)張られているかを格納する配列の配列1・・1001
	var anchorFromList = {};
	
	// アンカーしているものを格納するMAP(内部は配列要素)
	zweiChThreadView.anchorToList = {};//初期化&クリア
	zweiChThreadView.anchorCounterList = {};//初期化&クリア
	
	
	//レス番号を一時格納する変数
	var resNum;
	
	var $targets = jQuery(this).find("dd");
	$targets.each(function() {
		
		//レス番号を検索
		resNum = $(this).prev().findResNum();
		//レス番号をキーとしたtoListを初期化
		zweiChThreadView.anchorToList[resNum] = [];
		
		// アンカーを返す
		var resAnchors = $(this).findResAnchors();
		for(var i=0; i < resAnchors.length ; i++) {
			if(!anchorCounterList[resAnchors[i]]){
				// 変数が初期化されてないので1を格納
				anchorCounterList[resAnchors[i]] = 1;
			} else {
				//　変数がすでにあるなら1加算
				anchorCounterList[resAnchors[i]]++;
			}
			
			if(!anchorFromList[resAnchors[i]]) {
				//変数が初期化されてないので配列を生成
				anchorFromList[resAnchors[i]] = [];
			}
			anchorFromList[resAnchors[i]].push(resNum);
			
			zweiChThreadView.anchorToList[resNum].push(resAnchors[i]);
		}

	});
	
	// 他ファイルから使用できるようにグローバル変数にコピー
	zweiChThreadView.anchorFromList = anchorFromList;
	zweiChThreadView.anchorCounterList = anchorCounterList;
	
	/*
	 * HTML-強調表示装飾処理
	 */
	var $dtTags = jQuery(this).find("dt");
	var result,decidetColor;
	$dtTags.each(function() {
		//レス番号を検索
		resNum = $(this).findResNum();
		
		if(anchorCounterList[resNum] !== undefined){
			if(num <= anchorCounterList[resNum]){
			 //強調表示色で装飾
				decidetColor = strongColor;
			} else {
				decidetColor = normalColor;
			}
			 //通常表示色で装飾
			result = replaceResNum($(this).html(),
					"<font color=\"" + decidetColor +"\" " +
					 " style=\"font-weight:bold\" " +
							"class=\"" + zweiChThreadView.REORIGN_MARK + "\">$1</font>");
			
			// 編集した結果を格納
			$(this).html(result);
			
			if(numDsp) {
				$(this).append("<font class=\"" + zweiChThreadView.NOTCOPY_MARK + 
						"\" style=\"font-weight:bold\" color=\"" + numDspColor +"\">" 
						+ "&nbsp;" + anchorHeader + anchorCounterList[resNum] + "</font>");
			}
		}
	});
	return this;
};

/**
 * このプラグインで付与したHTMLを元に戻します
 * 引数にはコピー先のフレームのjQueryオブジェクトを渡してください
 * オリジナルのスレッドフレームのjQueyオブジェクトを渡すとオリジナルのHTMLが破壊されます
 * 
 * @selecter 2ch-HTML (コピーフレーム)
 * @return jQuryオブジェクト
 */
jQuery.fn.threadViewDelete = function() {

	jQuery(this).find("." + zweiChThreadView.NOTCOPY_MARK).remove();
	
	var $reOrigins = jQuery(this).find("." + zweiChThreadView.REORIGN_MARK);
	
	// zweiChThreadView.REORIGN_MARKは複数あるのでzweiChThreadView.REORIGN_MARKを各々で処理する
	$reOrigins.each(
		function(){
			$(this).replaceWith($(this).text());
		}
	);
	
	return this;
};

/**
 * dtタグ要素からレス番号を返却します
 * @selecter 2ch-HTML DT要素
 * @return レス番号 
 */
jQuery.fn.findResNum = function () {
	// レス番号を取得する正規表現
	var findResNumRegex = /^\d{1,4}/;
	var nums = $(this).text().match(findResNumRegex);
	return nums[0];
};

/**
 * 2chのレスIDを探します
 * @param string (文字列、2ch-HTML　dt要素の文字列)
 * @returns 検索できたid。検索不一致ならnull
 */
function findResId(string) {
	var regex = /ID:.{9}/;
	var regex8 = /ID:.{8}/;
	var id;
	
	//テキスト内から正規表現で検索
	id = string.match(regex);

	//idが9桁でマッチしない場合はIDは8桁と判断し再度検索にかける
	if(id === null){
		id = string.match(regex8);
	}
	
	return id;
}

/**
 * 2chのレスIDを元に正規表現でreplaceします
 * @param string (文字列、2ch-HTML　dt要素の文字列)
 * @param change (置き換え後の文字列)
 * @returns 置き換えた文字列。検索にマッチせず置き換えられなかったら引数のstring
 */
function replaceResId(string,change) {
	var regex4replace = /(ID:.{9})/;
	var regex4replace8 = /(ID:.{8})/;
	var result;
	
	//テキスト内から正規表現で検索
	result = string.replace(regex4replace,change);
	
	//idが9桁でマッチしない場合はIDは8桁と判断し再度検索にかける
	if(result === string){
		result = string.replace(regex4replace8,change);
	}
	
	return result;
}

/**
 * 2chのレス番号を元に正規表現でreplaceします
 * @param string (文字列、2ch-HTML　dt要素の文字列)
 * @param change (置き換え後の文字列)
 * @returns 置き換えた文字列。検索にマッチせず置き換えられなかったら引数のstring
 */
function replaceResNum(string,change) {
	var regex4replace = /^(\d{1,4})/;
	var result;
	
	//テキスト内から正規表現で検索
	result = string.replace(regex4replace,change);
	return result;
}

//TODO jQuery.fn.delLinkAnchorと統一化できたらしたい
//TODO 短縮アンカーには未対応(PT3/PT4)
/**
 * 2chのレスの中からアンカーを探します
 * @selector 2ch-HTML dd要素
 * @return アンカー番号が入っている配列、アンカーが見つからなかったら長さ0の配列を返却
 */
jQuery.fn.findResAnchors = function () {
	/**
	 * アンカーパターンは4種類
	 * PT1) >>1 通常のアンカー、HTMLにリンクがついている
	 * PT2) >>1-100 連結アンカー、HTMLにリンクがついている
	 * PT3) >1 短縮アンカー、HTMLにリンクはつかない（2chブラウザではアンカー扱い）
	 * PT4) >1-100 短縮連結アンカー、HTMLにリンクはつかない(2chブラウザではアンカー扱い)
	 */
	
	// 返却用の配列を生成
	var anchorBox = [];
	// 重複アンカーを判定する配列  配列数：1..1001のBoolean格納ボックス　
	var doubleAnchorJudge = {};
	// Aリンクを抽出
	var $targets = jQuery(this).find("a");
	// アンカー用の正規表現 (PT1,PT3)　gオプションを使用しないこと
	var regex = /(&gt;){1,2}(\d{1,4})/;
	// 連結アンカー用の正規表現 (PT2,PT4)　gオプションを使用しないこと
	var connectRgx = /(&gt;){1,2}(\d{1,4})-{1,2}(\d{1,4})/;

	var results,connectResults,i;
	$targets.each(function() {
		
		connectResults = $(this).html().match(connectRgx);
		
		if (connectResults != null && connectResults.length > 0){
			// 連結アンカー用の処理(PT2)
			results = numberConnection(connectResults[2],connectResults[3]);
			
			for (i=0; i < results.length; i++) {
				 regist();
			}
			
		} else {
			// ノーマルアンカー用の処理(PT1)
			results = $(this).html().match(regex);
			if (results != null && results.length > 0) {
				results.shift();
				for (i = 1; i <= results.length; i += 2) {
					/*
					 * resultsは以下が格納されている
					 * 例： マッチ対象文が "～&gt;&gt;1～"の場合 
					 * [0] ～&gt;&gt;1～ 
					 * [1] &gt;&gt; 
					 * [2] 1
					 */
					regist();
				}
			}
		}
	});
	
	return anchorBox;
	
	function regist(){
		if (doubleAnchorJudge[results[i]] !== true) {
			// 1DDで同じレス項番にたいしての重複アンカーは避ける
			anchorBox.push(results[i]);

			doubleAnchorJudge[results[i]] = true;
		}
	}
};

/**
 * 2つの引数を数値列に展開して配列に格納します
 * @param num1 開始数
 * @param num2 終了数
 * @return 展開した数が入っている配列
 */
function numberConnection(num1,num2){
	var results = [];
	
	num1 = parseInt(num1,10);
	
	while(num1 <= num2) {
		results.push(num1);
		num1++;
	}
	return results;
}

/**
 * 2chのレスIDを返却します
 * @selecter DT Selecter
 * @return 2ch-id
 */
jQuery.fn.findResId = function () {
	return findResId($(this).html());
};
