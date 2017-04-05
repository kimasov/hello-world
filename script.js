function WorkArea(nNode, oSettings, iPrefWidth, iPrefHeight) {

    this.nNode = nNode;                                                         //Элемент в котором будем рисовать
    this.oSettings = oSettings;

    this.oPicture = false;
    this.oPreset = false;

    this.iPrefWidth = iPrefWidth;
    this.iPrefHeight = iPrefHeight;
    this.iW;
    this.iH;

    this.windowH = window.innerHeight;
    this.windowW = window.innerWidth;

    this.mouse = {};

    this.iRealW = false;                                                        //Установленная реальная ширина картины
    this.iRealH = false;                                                        //Установленная реальная высота картины
    this.oRange = {};
    this.oCoef = {};
}

/*
Рисует рабочую область.
*/
WorkArea.prototype.initNode = function() {

    if(!this.oPicture) {
        console.log('Не установлена картинка');
        return;
    }

    var iW, iH, iTop, iLeft;

    if(this.oPicture.sOrientation === 'horizontal') {

        iW = this.iPrefWidth;

        iH = this.iPrefWidth * (this.oPicture.iOriginalH / this.oPicture.iOriginalW);

    } else if(this.oPicture.sOrientation === 'vertical') {

        iH = this.iPrefHeight;

        iW = this.iPrefHeight * (this.oPicture.iOriginalW / this.oPicture.iOriginalH);
    }

    this.iW = iW;
    this.iH = iH;

    this.nNode.style.width = iW + 'px';

    this.nNode.style.height = iH + 'px';

    iTop = (this.windowH - iH) / 2;
    this.nNode.style.top = iTop + 'px';

    iLeft = (this.windowW - iW) / 2;
    this.nNode.style.left = iLeft + 'px';

    this.nNode.style.backgroundImage = 'url(' + this.oPicture.fpResizedSrc + ')'

    this.nNode.onmousemove = function(e) {
        this.mouse = {
            x: e.pageX - iLeft,
            y: e.pageY - iTop
        }
    }
}

WorkArea.prototype.setRealSizeByWidth = function(iRealWidth) {

    if(iRealWidth < this.oRange.iMaxW && iRealWidth > this.oRange.iMin) {

        this.iRealW = iRealWidth;
        this.iRealH = iRealWidth * (this.oPicture.iOriginalH / this.oPicture.iOriginalW);

    } else {
        console.log('Ширина не входит в допустимый диапазон');
    }

}

/*
Отчищает от содержимого рабочую область
*/
WorkArea.prototype.clearContent = function() {
    this.oNode.innerHTML = '';
}

/*
Рассчитывает коэффициенты пересчета величин,
на которые надо умножить величину что бы получить другую
*/
WorkArea.prototype.initCoeff = function(oBox) {

    //var iAvailHorPx = this.iW - (((this.oPreset.iSectionsCount - 1) * this.oSettings.iModulesOffset) + (this.oSettings.iEdgeOffset * 2));
    //var iAvailVerPx = this.iH - (this.oSettings.iEdgeOffset * 2);

    this.oCoef.pxToMmHor = this.iRealW / this.iW;
    this.oCoef.pxToMmVer = this.iRealH / this.iH;

    this.oCoef.mmToPxHor = this.iW / this.iRealW;
    this.oCoef.mmToPxVer = this.iH / this.iRealH;

    var iAvailHorPx = this.iW - ((((this.oPreset.iSectionsCount - 1) * this.oSettings.iModulesOffset) + (this.oSettings.iEdgeOffset * 2)) * this.oCoef.mmToPxHor);
    var iAvailVerPx = this.iH - (this.oSettings.iEdgeOffset * 2) * this.oCoef.mmToPxVer;

    this.oCoef.iAvailHor = iAvailHorPx;
    this.oCoef.iAvailVer = iAvailVerPx;

    this.oCoef.pxToPctHor = 100 / iAvailHorPx;
    this.oCoef.pxToPctVer = 100 / iAvailVerPx;

    this.oCoef.pctToPxHor = iAvailHorPx / 100;
    this.oCoef.pctToPxVer = iAvailVerPx / 100;
}

/*
Метод для пересчета  коэфицентов
*/
WorkArea.prototype.getConvertedValue = function(iValue, sMethod, oContext) {

    var iResult;

    switch(sMethod) {
        case 'pxtommhor':
            iResult = iValue * oContext.oCoef.pxToMmHor;
            break;
        case 'pxtommver':
            iResult = iValue * oContext.oCoef.pxToMmVer;
            break;
        case 'pxtopcthor':
            iResult = iValue * oContext.oCoef.pxToPctHor;
            break;
        case 'pxtopctver':
            iResult = iValue * oContext.oCoef.pxToPctVer;
            break;
        case 'mmtopxhor':
            iResult = iValue * oContext.oCoef.mmToPxHor;
            break;
        case 'mmtopxver':
            iResult = iValue * oContext.oCoef.mmToPxVer;
            break;
        case 'pcttopxhor':
            iResult = iValue * oContext.oCoef.pctToPxHor;
            break;
        case 'pcttopxver':
            iResult = iValue * oContext.oCoef.pctToPxVer;
            break;
        default:
            console.log('Метод конвертации не найден');
    }

    return iResult;
}

WorkArea.prototype.setPreset = function(oPreset) {

    this.oPreset = oPreset;

}

WorkArea.prototype.setPicture = function(oPicture) {

    if(!oPicture.iMaxW || !oPicture.iMaxH) {
        this.oRange.iMaxW = oPicture.iOriginalW * this.oSettings.iPxMmPrintCoef;

        this.oRange.iMaxH = oPicture.iOriginalH * this.oSettings.iPxMmPrintCoef;
    }

    this.oPicture = oPicture;

    this.oRange.iMin = (this.oSettings.iEdgeOffset * 2) + this.oSettings.iFrameMinSize;

}

WorkArea.prototype.drawView = function() {

    var nSection, iEdge, iOffset, oContext, iLeft, iWidth, iWidthCumulative = 0;

    iEdge = this.__proto__.getConvertedValue(this.oSettings.iEdgeOffset, 'mmtopxhor', this);
    iOffset = this.__proto__.getConvertedValue(this.oSettings.iModulesOffset, 'mmtopxhor', this);
    oContext = this;

    this.oPreset.arSections.forEach(function(oSection) {

        nSection = document.createElement('div');
        nSection.className = 'section';

        nSection.style.top = oContext.__proto__.getConvertedValue(((100 - oSection.iH) / 2) + oSection.iHP, 'pcttopxver', oContext) + iEdge + 'px';

        if(oSection.i == 1) {
            iLeft = iEdge;
        } else {
            iLeft = iEdge + (iOffset * (oSection.i - 1));
        }

        nSection.style.left = iLeft + iWidthCumulative + 'px';

        iWidth = oContext.__proto__.getConvertedValue(oSection.iW, 'pcttopxhor', oContext);
        nSection.style.width = iWidth + 'px';
        iWidthCumulative += iWidth;
        nSection.style.height = oContext.__proto__.getConvertedValue(oSection.iH, 'pcttopxver', oContext) + 'px';

        oContext.nNode.appendChild(nSection);
    });
}

WorkArea.prototype.getVerticalEditNodes = function(iSecId) {

    var nTop, nCenter, nBottom;

    nTop = document.createElement('div');
    nTop.className = 'v-edit-top';
    nTop.setAttribute('data-section-id');

    nTop.onmousedown = function() {

    };

    nTop.onmouseup = function() {

    }

}

WorkArea.prototype.updateView = function() {

}

/*
Объект картинки
*/
function Picture(rSrc, iW, iH, iMaxW, iMaxH) {

    this.iOriginalH = iH;                                                       //Высота оригинала
    this.iOriginalW = iW;                                                       //Ширина оригинала
    this.fpResizedSrc = rSrc;                                                   //Путь к изображению уменьшенному, которое можно показывать в паблик
    this.iMaxH = iMaxH;                                                         //Максимальный размер распечатки, мм
    this.iMaxW = iMaxW;                                                         //Максимальный размер распечатки, мм

    if(iH <= iW) {
        this.sOrientation = 'horizontal';
    } else {
        this.sOrientation = 'vertical';
    }

}

/*
Объект пресета
*/
function Preset(bAllowHorizontal, bAllowVertical) {
    this.arSections = [];
    this.iSectionsCount = 0;
    this.bAllowHorizontal = bAllowHorizontal;
    this.bAllowVertical = bAllowVertical;
}

Preset.prototype.appendSection = function(oSection) {                           //Добавляет по одной секции
    oSection.i = this.iSectionsCount + 1;
    this.arSections.push(oSection);
    this.iSectionsCount++;
}

Preset.prototype.getSectionsFromJson = function(jsonSections) {                 //Получает секции из json
    var arSections = JSON.parse(jsonSections);
    var i = 1;
    arSections.forEach(function(item) {
        item.i = i;
        i++;
    });
    this.arSections = arSections;
    this.iSectionsCount = this.arSections.length;
}

/*
Объект секции
*/
function Section(iW, iH, iHP) {
    this.iW = iW;
    this.iH = iH;
    this.iHP = iHP;
}

/*
Объект настроек
*/
function Settings(iModulesOffset, iEdgeOffset, iFrameMinSize, iPxMmPrintCoef) {
    this.iModulesOffset = iModulesOffset,                                       //Отступ между соседними картинами, мм
    this.iEdgeOffset = iEdgeOffset,                                             //Отступ от края изображения, мм
    this.iFrameMinSize = iFrameMinSize                                          //Минимальная величина стороны рамки, мм
    this.iPxMmPrintCoef = iPxMmPrintCoef;                                       //Коэфициент для расчета максимального размера печати пикс/мм
}
