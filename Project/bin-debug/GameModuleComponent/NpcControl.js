var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var __extends = this && this.__extends || function __extends(t, e) { 
 function r() { 
 this.constructor = t;
}
for (var i in e) e.hasOwnProperty(i) && (t[i] = e[i]);
r.prototype = e.prototype, t.prototype = new r();
};
var NpcControl = (function (_super) {
    __extends(NpcControl, _super);
    function NpcControl(gameplayElementFactory) {
        var _this = _super.call(this) || this;
        _this.creatorWorkParam = new CreatorWorkParam();
        _this.npcElementCreator = new NpcElementCreator(gameplayElementFactory);
        return _this;
    }
    NpcControl.prototype.Init = function () {
        // this.skillNpcArray = [];
        // this.aliveNpcArray = [];
        this.lastTurnNum = -1;
        this.npcControlState = NpcControlState.None;
        this.remindMoveUpNum = 0;
        this.remindCreateEnemyTurns = -1;
        this.curDifficultyId = 0;
        this.curDifficultyShieldProperty = 0;
        this.curDifficultyCreateEnemyLineNum = 0;
        this.moveUpFinish = false;
        GameMain.GetInstance().AddEventListener(SceneElementAccessAnswerEvent.EventName, this.OnReciveSceneData, this);
        GameMain.GetInstance().AddEventListener(SceneElementControlFailedEvent.EventName, this.OnAddElementToSceneFailed, this);
    };
    NpcControl.prototype.Release = function () {
        // this.skillNpcArray = [];
        // this.aliveNpcArray = [];
        this.lastTurnNum = -1;
        this.moveUpFinish = false;
        GameMain.GetInstance().RemoveEventListener(SceneElementAccessAnswerEvent.EventName, this.OnReciveSceneData, this);
        GameMain.GetInstance().RemoveEventListener(SceneElementControlFailedEvent.EventName, this.OnAddElementToSceneFailed, this);
    };
    NpcControl.prototype.Work = function (param) {
        _super.prototype.Work.call(this, param);
        var controlWorkParam = param;
        if (controlWorkParam.turn > this.lastTurnNum) {
            this.OnStartNewTurn();
            this.lastTurnNum = controlWorkParam.turn;
        }
        if (this.npcControlState == NpcControlState.DestroyObstruction) {
            //接上一次NpcControl的操作，直接跳转到AddNpcToScene
            this.npcControlState = NpcControlState.AddNpcToScene;
            return;
        }
        if (this.npcControlState == NpcControlState.NpcSkill) {
            //接上一次NpcControl的操作，直接跳转到NpcControlFinish
            this.npcControlState = NpcControlState.NpcControlFinish;
            return;
        }
        this.npcSmileSound = null;
        this.curNpcSkillInfo = null;
        if (this.npcControlState == NpcControlState.MoveAllUp) {
            this.CreateEnemyLine(0, this.curDifficultyShieldProperty, Scene.Rows - 1);
            this.npcSmileSound = this.remindMoveUpNum > 0 ? null : "EnemySinisterSmile1_mp3";
            return;
        }
        if (this.npcControlState == NpcControlState.None) {
            // if(this.gameMode == GameMode.BossFight)
            // {
            //     if(controlWorkParam.turn != 0 && controlWorkParam.turn % TurnNum_CreateSkillBossTurnNum == 0 
            //         && this.skillNpcArray.length < skillBossMaxNum)
            //     {
            //         //创建boss
            //         this.creatorWorkParam.paramIndex = NpcElementCreateType.RandomSuperVirus;
            //         this.creatorWorkParam.createNum = 1;
            //         this.tobeAddToSceneNpcArray = [];
            //         this.tobeAddToSceneNpcArray.push(this.npcElementCreator.CreateElement(this.creatorWorkParam));
            //         //向scene询问已经存在的boss的格子，用来放置新生成的boss
            //         var event = new SceneElementAccessEvent();
            //         event.accessType = SceneElementType.PlaceHolder;
            //         event.answerType = SceneElementAccessAnswerType.Pos;
            //         event.startX = 0;
            //         event.startY = 2;
            //         event.accesser = this;
            //         GameMain.GetInstance().DispatchEvent(event);
            //         this.npcSmileSound = "EnemySinisterSmile2_mp3"; 
            //         return;
            //     }    
            //     if(this.skillNpcArray.length > 0 && controlWorkParam.turn % TurnNum_BossSkillTurnNum == 0)
            //     {
            //         //boss放技能
            //         let id:number = Math.floor(this.skillNpcArray.length * Math.random());
            //         let skillNpc:NpcElement = this.skillNpcArray[id];
            //         //首先向scene查询对应物体的列表
            //         var event = new SceneElementAccessEvent();
            //         event.accesser = this;
            //         event.answerType = SceneElementAccessAnswerType.Instance;
            //         if(skillNpc.SkillType() == NpcSkillType.AddShieldForVirus ||
            //             skillNpc.SkillType() == NpcSkillType.ChangeVirusColor)
            //         {
            //             event.accessType = SceneElementType.Virus;
            //         }
            //         else if(skillNpc.SkillType() == NpcSkillType.ChangePillToVirus)
            //         {
            //             event.accessType = SceneElementType.Pill;
            //         }
            //         else
            //         {
            //             console.error("Invalid Skill Type " + skillNpc.SkillType());
            //         }
            //         this.curNpcSkillInfo = new BossSkillInfo();
            //         this.curNpcSkillInfo.skillCaster = skillNpc;
            //         GameMain.GetInstance().DispatchEvent(event);
            //         return;
            //     }
            // }
            if (this.remindCreateEnemyTurns >= 0 && this.remindCreateEnemyTurns <= 3) {
                //TODO：小怪降临的特效提示
                var enemyBornWarningEvent = new EnemyBornWarningEvent();
                enemyBornWarningEvent.enemyLine = this.curDifficultyCreateEnemyLineNum;
                enemyBornWarningEvent.bornCountDown = this.remindCreateEnemyTurns;
                GameMain.GetInstance().DispatchEvent(enemyBornWarningEvent);
            }
            if (this.remindCreateEnemyTurns <= 0) {
                //创建普通小怪
                if (controlWorkParam.turn == 0) {
                    this.remindInitCreateEnemyLines = Procedure_InitCreateEnemyLine;
                    this.npcControlState = NpcControlState.InitCreateEnemy;
                    this.addAllNpcInOneTime = true;
                    this.npcControlTimer = 0;
                    this.addNpcToSceneInterval = Time_AddNpcToSceneIntervalMax;
                }
                else {
                    this.npcControlState = NpcControlState.MoveAllUp;
                    this.remindMoveUpNum = this.curDifficultyCreateEnemyLineNum;
                    this.addAllNpcInOneTime = false;
                }
                return;
            }
        }
        //npc 啥事也不做
        this.npcControlState = NpcControlState.NpcControlFinish;
    };
    NpcControl.prototype.CreateEnemyLine = function (maxEmptyNum, shieldProperty, line) {
        var createNum = Scene.Columns - Math.floor(Math.random() * maxEmptyNum);
        this.CreateRandomVirus(createNum, shieldProperty, 0, line, Scene.Columns - 1, line);
    };
    NpcControl.prototype.CreateRandomVirus = function (createNum, shieldProperty, startX, startY, endX, endY) {
        this.creatorWorkParam.paramIndex = NpcElementCreateType.RandomVirus;
        this.creatorWorkParam.createNum = createNum;
        this.tobeAddToSceneNpcArray = this.npcElementCreator.CreateElement(this.creatorWorkParam);
        //给新生成的小怪添加护盾
        if (shieldProperty > 0) {
            for (var i = 0; i < this.tobeAddToSceneNpcArray.length; ++i) {
                var npc = this.tobeAddToSceneNpcArray[i];
                if (Math.random() <= shieldProperty) {
                    npc.AddShield(1);
                }
            }
        }
        //向scene询问空的格子，用来放置新生成的小怪
        var event = new SceneElementAccessEvent();
        event.accesser = this;
        event.accessType = SceneElementType.Empty;
        event.answerType = SceneElementAccessAnswerType.Pos;
        event.startX = startX;
        event.startY = startY;
        if (endX != undefined && endY != undefined) {
            event.endX = endX;
            event.endY = endY;
        }
        GameMain.GetInstance().DispatchEvent(event);
    };
    NpcControl.prototype.OnReciveSceneData = function (event) {
        if (event.accesser == this) {
            if (this.curNpcSkillInfo != null) {
                this.PrepareNpcSkillInfo(event.queryAnswerArray);
            }
            else {
                this.ArrangePosForNewNpcElements(event.queryAnswerArray);
            }
        }
    };
    NpcControl.prototype.UpdateInternal = function (deltaTime) {
        switch (this.npcControlState) {
            case NpcControlState.AddNpcToScene:
                this.UpdateAddNpcToScene(deltaTime);
                break;
            case NpcControlState.PlaySinisterSmileSound:
                this.UpdatePlaySinisterSmileSound(deltaTime);
                break;
            case NpcControlState.MoveAllUp:
                this.UpdateMoveAllUp(deltaTime);
                break;
            case NpcControlState.NpcControlFinish:
                this.UpdateNpcControlFinish(deltaTime);
                break;
            case NpcControlState.InitCreateEnemy:
                this.UpdateInitCreateEnemy(deltaTime);
                break;
        }
    };
    NpcControl.prototype.UpdateAddNpcToScene = function (deltaTime) {
        if (this.tobeAddToSceneNpcArray != null && this.tobeAddToSceneNpcArray.length > 0) {
            if (this.addAllNpcInOneTime) {
                var event = new SceneElementControlEvent();
                event.controlType = SceneElementControlType.Add;
                event.sceneElements = [];
                event.playerControl = false;
                for (var i = 0; i < this.tobeAddToSceneNpcArray.length; ++i) {
                    var temp = this.tobeAddToSceneNpcArray[i].GetSceneElements();
                    for (var j = 0; j < temp.length; ++j)
                        event.sceneElements.push(temp[j]);
                }
                GameMain.GetInstance().DispatchEvent(event);
                this.tobeAddToSceneNpcArray[0].PlaySound(NpcSoundType.Born);
                this.tobeAddToSceneNpcArray = null;
            }
            else {
                this.npcControlTimer += deltaTime;
                if (this.npcControlTimer >= this.addNpcToSceneInterval) {
                    var index = this.tobeAddToSceneNpcArray.length - 1;
                    var npc = this.tobeAddToSceneNpcArray[index];
                    var event = new SceneElementControlEvent();
                    event.controlType = SceneElementControlType.Add;
                    event.sceneElements = npc.GetSceneElements();
                    event.playerControl = false;
                    GameMain.GetInstance().DispatchEvent(event);
                    npc.PlaySound(NpcSoundType.Born);
                    this.tobeAddToSceneNpcArray.splice(index, 1);
                    this.npcControlTimer = 0;
                    this.addNpcToSceneInterval -= Time_AddNpcToSceneIntervalStep;
                    this.addNpcToSceneInterval = Math.max(this.addNpcToSceneInterval, Time_AddNpcToSceneIntervalMin);
                }
            }
        }
        else {
            this.tobeAddToSceneNpcArray = null;
            if (this.npcSmileSound != null) {
                //this.remindCreateEnemyTurns = TurnNum_CreateEnemyTurnNum;
                this.remindCreateEnemyTurns = this.GetDifficultyCreateEnemyTurnNum();
                this.curDifficultyShieldProperty = this.GetDifficultyCreateEnemyShieldProperty();
                this.curDifficultyCreateEnemyLineNum = this.GetDifficultyCreateEnemyLineNum();
                this.AddDifficulty();
                this.npcControlState = NpcControlState.PlaySinisterSmileSound;
            }
            else if (this.remindMoveUpNum > 0) {
                this.npcControlState = NpcControlState.MoveAllUp;
            }
            else if (this.remindInitCreateEnemyLines > 0) {
                this.npcControlState = NpcControlState.InitCreateEnemy;
            }
            else {
                //this.remindCreateEnemyTurns = TurnNum_CreateEnemyTurnNum;
                this.remindCreateEnemyTurns = this.GetDifficultyCreateEnemyTurnNum();
                this.curDifficultyShieldProperty = this.GetDifficultyCreateEnemyShieldProperty();
                this.curDifficultyCreateEnemyLineNum = this.GetDifficultyCreateEnemyLineNum();
                this.AddDifficulty();
                this.npcControlState = NpcControlState.NpcControlFinish;
            }
        }
    };
    NpcControl.prototype.UpdatePlaySinisterSmileSound = function (deltaTime) {
        if (this.npcSmileSound != null) {
            this.npcControlTimer = Time_PlayEnemySinisterSmileTime;
            var event_1 = new PlaySoundEvent(this.npcSmileSound, 1);
            GameMain.GetInstance().DispatchEvent(event_1);
            this.npcSmileSound = null;
        }
        else {
            this.npcControlTimer -= deltaTime;
            if (this.npcControlTimer <= 0) {
                if (this.remindMoveUpNum > 0) {
                    this.npcControlState = NpcControlState.MoveAllUp;
                }
                else {
                    this.npcControlState = NpcControlState.NpcControlFinish;
                }
            }
        }
    };
    NpcControl.prototype.UpdateNpcControlFinish = function (delteTime) {
        this.npcControlState = NpcControlState.None;
        var event = new NpcControlFinishEvent();
        if (this.moveUpFinish) {
            event.moveUpFinish = true;
            this.moveUpFinish = false;
        }
        GameMain.GetInstance().DispatchEvent(event);
    };
    NpcControl.prototype.UpdateMoveAllUp = function (deltaTime) {
        //这个状态，只负责通知并等待scene将场景上移
        if (this.remindMoveUpNum > 0) {
            this.remindMoveUpNum--;
            if (this.remindMoveUpNum <= 0)
                this.moveUpFinish = true;
            var event_2 = new NpcControlFinishEvent();
            event_2.specialEliminateMethod = new EliminateMethod();
            event_2.specialEliminateMethod.methodType = EliminateMethodType.MoveUp;
            event_2.specialEliminateMethod.moveUpValue = 1;
            GameMain.GetInstance().DispatchEvent(event_2);
        }
        else {
            this.npcControlState = NpcControlState.NpcControlFinish;
        }
    };
    NpcControl.prototype.UpdateInitCreateEnemy = function (deltaTime) {
        if (this.remindInitCreateEnemyLines > 0) {
            this.npcControlTimer += deltaTime;
            if (this.npcControlTimer >= this.addNpcToSceneInterval) {
                this.npcControlState = NpcControlState.None;
                var createNum = Scene.Columns - 0;
                this.CreateRandomVirus(createNum, 0, 0, Scene.Rows - Procedure_InitCreateEnemyLine);
                this.remindInitCreateEnemyLines--;
                if (this.remindInitCreateEnemyLines <= 0) {
                    this.npcSmileSound = "EnemySinisterSmile1_mp3";
                }
                //时间控制
                this.npcControlTimer = 0;
                this.addNpcToSceneInterval -= Time_AddNpcToSceneIntervalStep;
                this.addNpcToSceneInterval = Math.max(this.addNpcToSceneInterval, Time_AddNpcToSceneIntervalMin);
            }
        }
        else {
            this.npcControlState = NpcControlState.NpcControlFinish;
        }
    };
    NpcControl.prototype.PrepareNpcSkillInfo = function (querySceneInstances) {
        var skillCaster = this.curNpcSkillInfo.skillCaster;
        var skillTargetArray = [];
        if (skillCaster.SkillType() == NpcSkillType.AddShieldForVirus) {
            var unShieldVirus = [];
            for (var i = 0; i < querySceneInstances.length; ++i) {
                var element = querySceneInstances[i];
                if (!element.HasShield()) {
                    unShieldVirus.push(element);
                }
            }
            var skillTargetNum = Math.min(unShieldVirus.length, TurnNum_BossSkillTargetNum);
            while (skillTargetNum > 0) {
                skillTargetNum--;
                var id = Math.floor(Math.random() * unShieldVirus.length);
                var sceneElement = unShieldVirus.splice(id, 1)[0];
                skillTargetArray.push(sceneElement);
            }
        }
        else {
            var skillTargetNum = Math.min(querySceneInstances.length, TurnNum_BossSkillTargetNum);
            while (skillTargetNum > 0) {
                skillTargetNum--;
                var id = Math.floor(Math.random() * querySceneInstances.length);
                var sceneElement = querySceneInstances.splice(id, 1)[0];
                skillTargetArray.push(sceneElement);
            }
        }
        if (skillTargetArray.length > 0) {
            //找到了一些元素来施放技能
            if (skillCaster.SkillType() == NpcSkillType.AddShieldForVirus) {
                this.curNpcSkillInfo.addHealthElement = skillTargetArray;
            }
            else if (skillCaster.SkillType() == NpcSkillType.ChangePillToVirus) {
                this.creatorWorkParam.paramIndex = NpcElementCreateType.RandomVirus;
                this.creatorWorkParam.createNum = skillTargetArray.length;
                var transToElementArray = undefined;
                if (this.creatorWorkParam.createNum > 1) {
                    transToElementArray = this.npcElementCreator.CreateElement(this.creatorWorkParam);
                }
                else {
                    transToElementArray = [];
                    transToElementArray.push(this.npcElementCreator.CreateElement(this.creatorWorkParam));
                }
                this.curNpcSkillInfo.elementTransList = [];
                for (var i = 0; i < skillTargetArray.length; ++i) {
                    var transInfo = new ElementTransInfo();
                    transInfo.fromElement = skillTargetArray[i];
                    var newSceneElementArray = transToElementArray[i].GetSceneElements();
                    if (newSceneElementArray.length != 1) {
                        console.error("Trans To Element Error");
                    }
                    transInfo.toElement = newSceneElementArray[0];
                    this.curNpcSkillInfo.elementTransList.push(transInfo);
                }
            }
            else if (skillCaster.SkillType() == NpcSkillType.ChangeVirusColor) {
                this.curNpcSkillInfo.elementChangeColorList = [];
                for (var i = 0; i < skillTargetArray.length; ++i) {
                    var changeColorInfo = new ElementChangeColorInfo();
                    changeColorInfo.element = skillTargetArray[i];
                    changeColorInfo.targetColor = GameElementColorGenerator.RandomColor(skillTargetArray[i].color);
                    this.curNpcSkillInfo.elementChangeColorList.push(changeColorInfo);
                }
            }
        }
        else {
            this.curNpcSkillInfo = null;
        }
        this.npcControlState = NpcControlState.NpcSkill;
        var controlFinishEvent = new NpcControlFinishEvent();
        controlFinishEvent.specialEliminateMethod = null;
        controlFinishEvent.bossSkillInfo = this.curNpcSkillInfo;
        GameMain.GetInstance().DispatchEvent(controlFinishEvent);
    };
    NpcControl.prototype.ArrangePosForNewNpcElements = function (querySceneBlocks) {
        var obstruction = [];
        for (var i = 0; i < this.tobeAddToSceneNpcArray.length; ++i) {
            var npc = this.tobeAddToSceneNpcArray[i];
            var subObstruction = this.ArrangePos(npc, querySceneBlocks);
            if (subObstruction != null) {
                obstruction = obstruction.concat(subObstruction);
            }
        }
        this.npcControlTimer = 0;
        this.addNpcToSceneInterval = Time_AddNpcToSceneIntervalMax;
        if (obstruction.length > 0) {
            this.npcControlState = NpcControlState.DestroyObstruction;
            var event_3 = new NpcControlFinishEvent();
            event_3.specialEliminateMethod = new EliminateMethod();
            event_3.specialEliminateMethod.methodType = EliminateMethodType.SpecificRegion;
            event_3.specialEliminateMethod.specificRegion = obstruction;
            event_3.specialEliminateMethod.eliminateElementType = EliminateElementType.Normal;
            event_3.specialEliminateMethod.froceKill = true;
            GameMain.GetInstance().DispatchEvent(event_3);
        }
        else {
            this.npcControlState = NpcControlState.AddNpcToScene;
        }
    };
    NpcControl.prototype.ArrangePos = function (npc, querySceneBlocks) {
        if (querySceneBlocks == undefined || querySceneBlocks == null) {
            console.error("Query Scene Blocks Failed");
            return null;
        }
        var result = null;
        if (npc.bornType == NpcBornType.Normal) {
            this.ArrangePosForNormalNpc(npc, querySceneBlocks);
        }
        else if (npc.bornType == NpcBornType.DestroyObstruction) {
            result = this.ArrangePosForDestroyObstructionNpc(npc, querySceneBlocks);
        }
        return result;
    };
    NpcControl.prototype.ArrangePosForNormalNpc = function (npc, querySceneBlocks) {
        if (querySceneBlocks == undefined || querySceneBlocks.length <= 0) {
            console.error("Not Enough Space For Normal Born Type Npcs");
            return;
        }
        var randomIndex = Math.floor(Math.random() * querySceneBlocks.length);
        var pos = querySceneBlocks.splice(randomIndex, 1)[0];
        npc.MoveTo(pos[0], pos[1]);
    };
    NpcControl.prototype.ArrangePosForDestroyObstructionNpc = function (npc, querySceneBlocks) {
        if (querySceneBlocks == undefined || querySceneBlocks == null) {
            console.error("Can't Get Placeholder Array In Scene?");
            return null;
        }
        var result = null;
        var validPos = this.GetValidPosForDestroyNpc(npc, querySceneBlocks);
        if (validPos.length > 0) {
            var randomIndex = Math.floor(Math.random() * validPos.length);
            var pos = validPos.splice(randomIndex, 1)[0];
            npc.MoveTo(pos[0], pos[1]);
            result = Tools.GetRegionPosList(pos[0], pos[1], pos[0] + npc.blockWidth - 1, pos[1] + npc.blockHeight - 1);
        }
        else {
            console.error("Not Enough Space For Destroy Obstruction Born Type NPC");
        }
        return result;
    };
    NpcControl.prototype.GetValidPosForDestroyNpc = function (npc, querySceneBlocks) {
        var validPos = [];
        for (var i = 0; i < Scene.Columns; ++i) {
            validPos.push([]);
            for (var j = 0; j < Scene.Rows; ++j) {
                var valid = (i <= Scene.Columns - npc.blockWidth) &&
                    (j <= Scene.Rows - npc.blockHeight) && j >= 2;
                validPos[i].push(valid ? 1 : 0);
            }
        }
        //根据现有的placeholder的位置，把不能生成的位置都排除掉
        for (var i = 0; i < querySceneBlocks.length; ++i) {
            var pos = querySceneBlocks[i];
            var invalidStartX = pos[0] - npc.blockWidth + 1;
            invalidStartX = Math.max(0, invalidStartX);
            var invalidStartY = pos[1] - npc.blockHeight + 1;
            invalidStartY = Math.max(0, invalidStartY);
            for (var ix = invalidStartX; ix <= pos[0]; ++ix) {
                for (var iy = invalidStartY; iy <= pos[1]; ++iy) {
                    validPos[ix][iy] = 0;
                }
            }
        }
        var result = [];
        for (var i = 0; i < (Scene.Columns - npc.blockWidth); ++i) {
            for (var j = 0; j < (Scene.Rows - npc.blockHeight); ++j) {
                if (validPos[i][j] == 1) {
                    var block = [];
                    block.push(i);
                    block.push(j);
                    result.push(block);
                }
            }
        }
        return result;
    };
    NpcControl.prototype.OnAddElementToSceneFailed = function (event) {
        if (!event.playerControl) {
            console.error("NpcControl Add Element To Scene Failed");
        }
    };
    NpcControl.prototype.OnStartNewTurn = function () {
        // //将已经死掉的npc从维护列表中移除
        // this.RemoveDeadNpcFromArray(this.aliveNpcArray);
        // //将已经死掉的npc从技能列表中移除
        // this.RemoveDeadNpcFromArray(this.skillNpcArray);
        //小怪降临时间维护
        if (this.remindCreateEnemyTurns >= 0)
            this.remindCreateEnemyTurns--;
    };
    // private RemoveDeadNpcFromArray(array:NpcElement[])
    // {
    //     var tobeDelete:number[] = [];
    //     for(var i = 0; i < array.length; ++i)
    //     {
    //         var npc:NpcElement = array[i];
    //         if(!npc.IsAlive())
    //         {
    //             tobeDelete.push(i);
    //         }
    //     }
    //     for(var i = 0; i < tobeDelete.length; ++i)
    //     {
    //         array.splice(tobeDelete[i], 1);
    //     }
    // }
    NpcControl.prototype.OnGameOver = function () {
        this.remindMoveUpNum = 0;
        this.npcControlState = NpcControlState.None;
        this.tobeAddToSceneNpcArray = null;
    };
    NpcControl.prototype.AddDifficulty = function () {
        if (this.curDifficultyId < Difficulty_MaxDifficulty - 1) {
            this.curDifficultyId++;
        }
    };
    NpcControl.prototype.GetDifficultyCreateEnemyTurnNum = function () {
        return Difficulty_CreateEnemyTurnNum[this.curDifficultyId];
    };
    NpcControl.prototype.GetDifficultyCreateEnemyLineNum = function () {
        return Difficulty_CreateEnmeyLineNum[this.curDifficultyId];
    };
    NpcControl.prototype.GetDifficultyCreateEnemyShieldProperty = function () {
        return Difficulty_ShieldProperty[this.curDifficultyId];
    };
    return NpcControl;
}(GameModuleComponentBase));
__reflect(NpcControl.prototype, "NpcControl");
var NpcControlState;
(function (NpcControlState) {
    NpcControlState[NpcControlState["None"] = 0] = "None";
    NpcControlState[NpcControlState["InitCreateEnemy"] = 1] = "InitCreateEnemy";
    NpcControlState[NpcControlState["DestroyObstruction"] = 2] = "DestroyObstruction";
    NpcControlState[NpcControlState["AddNpcToScene"] = 3] = "AddNpcToScene";
    NpcControlState[NpcControlState["PlaySinisterSmileSound"] = 4] = "PlaySinisterSmileSound";
    NpcControlState[NpcControlState["NpcSkill"] = 5] = "NpcSkill";
    NpcControlState[NpcControlState["MoveAllUp"] = 6] = "MoveAllUp";
    NpcControlState[NpcControlState["NpcControlFinish"] = 7] = "NpcControlFinish";
})(NpcControlState || (NpcControlState = {}));
//# sourceMappingURL=NpcControl.js.map