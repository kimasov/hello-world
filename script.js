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
    this.oEditor = {activeElem: false};
}

/*
Рисует рабочую область.
*/
WorkArea.prototype.initNode = function(oContext) {

    if(!oContext) {
        oContext = this;
    }

    if(!oContext.oPicture) {
        console.log('Не установлена картинка');
        return;
    }

    var iW, iH, iTop, iLeft;

    if(oContext.oPicture.sOrientation === 'horizontal') {

        iW = oContext.iPrefWidth;

        iH = oContext.iPrefWidth * (oContext.oPicture.iOriginalH / oContext.oPicture.iOriginalW);

    } else if(oContext.oPicture.sOrientation === 'vertical') {

        iH = oContext.iPrefHeight;

        iW = oContext.iPrefHeight * (oContext.oPicture.iOriginalW / oContext.oPicture.iOriginalH);
    }

    oContext.iW = iW;
    oContext.iH = iH;

    oContext.nNode.style.width = iW + 'px';

    oContext.nNode.style.height = iH + 'px';

    iTop = (oContext.windowH - iH) / 2;
    oContext.nNode.style.top = iTop + 'px';

    iLeft = (oContext.windowW - iW) / 2;
    oContext.nNode.style.left = iLeft + 'px';

    oContext.nNode.style.backgroundImage = 'url(' + oContext.oPicture.fpResizedSrc + ')'

    oContext.nNode.onmousemove = function(e) {

        oContext.mouse = {
            x: e.pageX - iLeft,
            y: e.pageY - iTop
        }

        if(oContext.oEditor.activeElem) {
            var sType = oContext.oEditor.activeElem.getAttribute('data-editor-type');

            switch(sType) {
                case 'in-v-top-drag':
                case 'in-v-bottom-drag':
                case 'in-v-center-drag':

                    var iYDelta, iAvailVer, iMinHeight, iEdge, nSection, oValues, bIsAllowed;

                    iAvailVer = oContext.oCoef.iAvailVer;
                    iMinHeight = oContext.__proto__.getConvertedValue(oContext.oSettings.iFrameMinSize, 'mmtopxver', oContext);
                    iEdge = oContext.__proto__.getConvertedValue(oContext.oSettings.iEdgeOffset, 'mmtopxver', oContext);
                    iYDelta = oContext.mouse.y - oContext.oEditor.iStartY + oContext.oEditor.iStartTop;
                    oValues = {
                        iMinHeight: iMinHeight,
                        iMaxHeigth: iAvailVer,
                        iEdge: iEdge,
                        iYDelta: iYDelta
                    };

                    bIsAllowed = oContext.__proto__.validateDragEdit(oContext, sType, oValues);

                    if(!bIsAllowed) {
                        oContext.__proto__.EditModelByDrag(oContext, oContext.mouse.x, oContext.mouse.y);
                    }

                    break;
                case 'in-h-drag':

                    var iXDelta, bIsAllowed;

                    iXDelta = oContext.mouse.x - oContext.oEditor.iStartX;
                    iMinWidth = oContext.__proto__.getConvertedValue(oContext.oSettings.iFrameMinSize, 'mmtopxhor', oContext);

                    oValues = {
                        iXDelta: iXDelta,
                        iMinWidth: iMinWidth
                    }

                    bIsAllowed = oContext.__proto__.validateDragEdit(oContext, sType, oValues);

                    if(bIsAllowed) {
                        oContext.oEditor.activeElem.style.left = oContext.mouse.x - oContext.oEditor.iStartX + oContext.oEditor.iStartLeft + 'px';
                    } else {
                        oContext.__proto__.EditModelByDrag(oContext, oContext.mouse.x, oContext.mouse.y);
                    }
                    break;
                default:
                    break;
            }
        }
    }
}

WorkArea.prototype.validateDragEdit = function(oContext, sType, oValues) {

    var bIsAllowed = false;

    switch(sType) {
        case 'in-v-top-drag':

            if(oContext.oEditor.oSection.top + oValues.iYDelta > oValues.iEdge
                && oContext.oEditor.oSection.height - oValues.iYDelta > oValues.iMinHeight) {
                bIsAllowed = true;
            }

            if(bIsAllowed === true) {
                oContext.oEditor.oSection.nNode.style.top = oContext.oEditor.oSection.top + oValues.iYDelta + 'px';
                oContext.oEditor.oSection.nNode.style.height = oContext.oEditor.oSection.height - oValues.iYDelta + 'px';
            }
            break;

        case 'in-v-center-drag':
            if(oContext.oEditor.oSection.top + oValues.iYDelta > oValues.iEdge
                && oContext.oEditor.oSection.top + oContext.oEditor.oSection.height + oValues.iYDelta < oValues.iEdge + oValues.iMaxHeigth) {
                bIsAllowed = true;
            }

            if(bIsAllowed === true) {
                oContext.oEditor.oSection.nNode.style.top = oContext.oEditor.oSection.top + oValues.iYDelta + 'px';
            }
            break;

        case 'in-v-bottom-drag':
            if(oContext.oEditor.oSection.top + oContext.oEditor.oSection.height + oValues.iYDelta < oValues.iEdge + oValues.iMaxHeigth
                && oContext.oEditor.oSection.height + oValues.iYDelta > oValues.iMinHeight) {
                bIsAllowed = true;
            }

            if(bIsAllowed === true) {
                oContext.oEditor.oSection.nNode.style.height = oContext.oEditor.oSection.height + oValues.iYDelta + 'px';
            }
            break;

        case 'in-h-drag':
            //проверить что ширина обоих колонн, после модификаии не будет меньше заданной
            if(oContext.oEditor.oSection.nLeftNode.width + oValues.iXDelta > iMinWidth
                && oContext.oEditor.oSection.nRightNode.width - oValues.iXDelta > iMinWidth) {
                bIsAllowed = true;
            }

            if(bIsAllowed === true) {
                var nLeft = oContext.oEditor.oSection.nLeftNode.node;
                var nRight = oContext.oEditor.oSection.nRightNode.node;

                nLeft.style.width = oContext.oEditor.oSection.nLeftNode.width + oValues.iXDelta + 'px';
                nRight.style.width = oContext.oEditor.oSection.nRightNode.width - oValues.iXDelta + 'px';
                nRight.style.left = oContext.oEditor.oSection.nRightNode.left + oValues.iXDelta + 'px';
            }

            break;

        default:
            break;
    }

    return bIsAllowed;
}

WorkArea.prototype.setRealSizeByWidth = function(iRealWidth, oContext) {

    if(!oContext) {
        oContext = this;
    }

    if(iRealWidth < oContext.oRange.iMaxW && iRealWidth > oContext.oRange.iMin) {

        oContext.iRealW = iRealWidth;
        oContext.iRealH = iRealWidth * (oContext.oPicture.iOriginalH / oContext.oPicture.iOriginalW);

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
WorkArea.prototype.initCoeff = function(oContext) {

    if(!oContext) {
        oContext = this;
    }

    oContext.oCoef.pxToMmHor = this.iRealW / this.iW;
    oContext.oCoef.pxToMmVer = this.iRealH / this.iH;

    oContext.oCoef.mmToPxHor = this.iW / this.iRealW;
    oContext.oCoef.mmToPxVer = this.iH / this.iRealH;

    var iAvailHorPx = oContext.iW - ((((oContext.oPreset.iSectionsCount - 1) * oContext.oSettings.iModulesOffset) + (oContext.oSettings.iEdgeOffset * 2)) * oContext.oCoef.mmToPxHor);
    var iAvailVerPx = oContext.iH - (oContext.oSettings.iEdgeOffset * 2) * oContext.oCoef.mmToPxVer;

    oContext.oCoef.iAvailHor = iAvailHorPx;
    oContext.oCoef.iAvailVer = iAvailVerPx;

    oContext.oCoef.pxToPctHor = 100 / iAvailHorPx;
    oContext.oCoef.pxToPctVer = 100 / iAvailVerPx;

    oContext.oCoef.pctToPxHor = iAvailHorPx / 100;
    oContext.oCoef.pctToPxVer = iAvailVerPx / 100;
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

WorkArea.prototype.drawView = function(oContext) {

    if(!oContext) {
        oContext = this;
    }

    var nSection, iEdge, iOffset, oContext, iLeft, iWidth, iWidthCumulative = 0, arHorEditPoints = [];

    iEdge = oContext.__proto__.getConvertedValue(oContext.oSettings.iEdgeOffset, 'mmtopxhor', oContext);
    iOffset = oContext.__proto__.getConvertedValue(oContext.oSettings.iModulesOffset, 'mmtopxhor', oContext);

    oContext.oPreset.arSections.forEach(function(oSection) {

        nSection = document.createElement('div');
        nSection.className = 'section';
        nSection.setAttribute('data-section-id', oSection.i);

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

        if(oSection.i != oContext.oPreset.arSections.length) {
            arHorEditPoints.push({
                coord: iWidthCumulative + iLeft,
                l: oSection.i,
                r: oSection.i + 1,
                edge: iEdge
            });
        }

        nSection.style.height = oContext.__proto__.getConvertedValue(oSection.iH, 'pcttopxver', oContext) + 'px';

        arVertEditNodes = oContext.__proto__.getVerticalEditNodes(oContext, oSection.i);

        arVertEditNodes.forEach(function(nEdit) {
            nSection.appendChild(nEdit);
        });

        oContext.nNode.appendChild(nSection);
    });

    arHorEditNodes = oContext.__proto__.getHorizontalEditNodes(oContext, arHorEditPoints);

    arHorEditNodes.forEach(function(nEdit) {
        oContext.nNode.appendChild(nEdit);
    });
}

WorkArea.prototype.getHorizontalEditNodes = function(oContext, arHorEditPoints) {

    var nDiv, arEditColl = [];

    arHorEditPoints.forEach(function(oPoint) {

        nDiv = document.createElement('div');
        nDiv.className = 'h-edit';
        nDiv.style.left = oPoint.coord + 'px';
        nDiv.style.width = oPoint.edge + 'px';
        nDiv.setAttribute('data-section-l', oPoint.l);
        nDiv.setAttribute('data-section-r', oPoint.r);
        nDiv.setAttribute('data-editor-type', 'in-h-drag');

        arEditColl.push(nDiv);
    });

    arEditColl.forEach(function(nNode) {

        var lNode, rNode;

        nNode.onmousedown = function(e) {
            e.preventDefault();
            if(!oContext.oEditor.activeElem) {
                oContext.oEditor.activeElem = this;
                oContext.oEditor.iStartX = oContext.mouse.x;
                oContext.oEditor.iStartY = oContext.mouse.y;
                oContext.oEditor.iStartLeft = parseFloat(this.style.left) || 0;

                lNode = document.querySelector('.section[data-section-id="' + this.getAttribute('data-section-l') + '"]');
                rNode = document.querySelector('.section[data-section-id="' + this.getAttribute('data-section-r') + '"]');

                oContext.oEditor.oSection = {
                    nLeftNode: {
                        node: lNode,
                        width: parseFloat(lNode.style.width)
                    },
                    nRightNode: {
                        node: rNode,
                        width: parseFloat(rNode.style.width),
                        left: parseFloat(rNode.style.left)
                    },

                }
            }
        };

        nNode.onmouseup = function() {
            oContext.__proto__.EditModelByDrag(oContext, oContext.mouse.x, oContext.mouse.y);
        }

    });

    return arEditColl;
}

WorkArea.prototype.getVerticalEditNodes = function(oContext, iSecId) {

    var nTop, nCenter, nBottom, arNodes;

    nTop = document.createElement('div');
    nTop.className = 'v-edit-top';
    nTop.setAttribute('data-section-id', iSecId);
    nTop.setAttribute('data-editor-type', 'in-v-top-drag')

    nBottom = document.createElement('div');
    nBottom.className = 'v-edit-bot';
    nBottom.setAttribute('data-section-id', iSecId);
    nBottom.setAttribute('data-editor-type', 'in-v-bottom-drag');

    nCenter = document.createElement('div');
    nCenter.className = 'v-edit-cen';
    nCenter.setAttribute('data-section-id', iSecId);
    nCenter.setAttribute('data-editor-type', 'in-v-center-drag');

    arNodes = [nTop, nCenter, nBottom];

    arNodes.forEach(function(nNode) {
        nNode.onmousedown = function(e) {
            e.preventDefault();
            if(!oContext.oEditor.activeElem) {
                oContext.oEditor.activeElem = this;
                oContext.oEditor.iStartX = oContext.mouse.x;
                oContext.oEditor.iStartY = oContext.mouse.y;
                oContext.oEditor.iStartTop = parseFloat(this.style.top) || 0;
                oContext.oEditor.oSection = {
                    nNode: this.parentNode,
                    top: parseFloat(this.parentNode.style.top),
                    height: parseFloat(this.parentNode.style.height)
                }
            }
        };

        nNode.onmouseup = function() {
            oContext.__proto__.EditModelByDrag(oContext, oContext.mouse.x, oContext.mouse.y);
        }
    });

    return arNodes;

}

WorkArea.prototype.EditModelByDrag = function(oContext, iX, iY) {

    var sEditType, iYDelta, iXDelta, iSecId, oSection, iLeftSec, iRightSec, oLeft, oRight;
    if(oContext.oEditor.activeElem) {
        sEditType = oContext.oEditor.activeElem.getAttribute('data-editor-type');
    } else {
        return;
    }
    switch(sEditType) {
        case 'in-v-top-drag':
        case 'in-v-bottom-drag':

            iYDelta = iY - oContext.oEditor.iStartY;
            iYDelta = oContext.__proto__.getConvertedValue(iYDelta, 'pxtopctver', oContext);
            iSecId = oContext.oEditor.activeElem.getAttribute('data-section-id');
            oSection = oContext.oPreset.__proto__.getSectionById(oContext, iSecId);

            if(sEditType == 'in-v-top-drag') {
                oSection.iH -= iYDelta;
            } else {
                oSection.iH += iYDelta;
            }

            oSection.iHP += iYDelta / 2;
            oContext.oPreset.__proto__.editSectionById(oContext, iSecId, oSection);
            oContext.__proto__.reDrawPreset(oContext);

            break;

        case 'in-v-center-drag':

            iYDelta = iY - oContext.oEditor.iStartY;
            iYDelta = oContext.__proto__.getConvertedValue(iYDelta, 'pxtopctver', oContext);
            iSecId = oContext.oEditor.activeElem.getAttribute('data-section-id');
            oSection = oContext.oPreset.__proto__.getSectionById(oContext, iSecId);

            oSection.iHP += iYDelta;
            oContext.oPreset.__proto__.editSectionById(oContext, iSecId, oSection);
            oContext.__proto__.reDrawPreset(oContext);

            break;

        case 'in-h-drag':

            iXDelta = iX - oContext.oEditor.iStartX;
            iXDelta = oContext.__proto__.getConvertedValue(iXDelta, 'pxtopcthor', oContext);
            iLeftSec = oContext.oEditor.activeElem.getAttribute('data-section-l');
            iRightSec = oContext.oEditor.activeElem.getAttribute('data-section-r');

            oLeft = oContext.oPreset.__proto__.getSectionById(oContext, iLeftSec);
            oRight = oContext.oPreset.__proto__.getSectionById(oContext, iRightSec);

            oLeft.iW += iXDelta;
            oRight.iW -= iXDelta;

            oContext.oPreset.__proto__.editSectionById(oContext, iLeftSec, oLeft);
            oContext.oPreset.__proto__.editSectionById(oContext, iRightSec, oRight);
            oContext.__proto__.reDrawPreset(oContext);

            break;

        case 'o-h-pic-size-grag':
            //перевести дельту в милиметры
            //пересчитать все представление
            break;
        default:
            break;
    }

    oContext.oEditor.activeElem = false;
    oContext.oEditor.iStartY = false;
    oContext.oEditor.iStartX = false;

}

WorkArea.prototype.reDrawPreset = function(oContext) {
    oContext.nNode.innerHTML = '';
    oContext.__proto__.drawView(oContext);
    console.log('re-draw complete!');
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

Preset.prototype.getSectionById = function(oContext, iSecId) {
    for(var i = 0; i < oContext.oPreset.arSections.length; i++) {
        var oSection = oContext.oPreset.arSections[i];
        if(oSection.i == iSecId) {
            return oSection;
        }
    }
}

Preset.prototype.editSectionById = function(oContext, iSecId, oSection) {
    for(var i = 0; i < oContext.oPreset.arSections.length; i++) {
        var oSection = oContext.oPreset.arSections[i];
        if(oSection.i == iSecId) {
            oContext.oPreset.arSections[i] = oSection;
        }
    }
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
