
cc.Class({
    extends: cc.Label,
    
    properties: {
    },

    // 게임이 시작하기 전에 초기화
    preInit() {
        
    },

    ctor () {
        this.isPlaying = false;
    },


    playUpdateValue(startVal, endVal, changingTime) {
        this.startVal = startVal;
        this.endVal = endVal;

        this.diffVal = this.endVal - this.startVal;
        
        this.currTime = 0;
        this.changingTime = changingTime;
        
        this.string = 0;

        this.isPlaying = true;
    },

    update(dt) {
        if(!this.isPlaying) {
            return;
        }

        if(this.currTime < this.changingTime) {
            this.currTime += dt;
            
            var currVal = this.startVal + parseInt(this.currTime / this.changingTime * this.diffVal);

            if (currVal < this.startVal) {
                currVal = this.startVal;
            } else if (currVal > this.endVal) {
                currVal = this.endVal;
            }
            
            this.string = currVal;
            return;
        }
        this.string = this.endVal;
        this.isPlaying = false;
        
    }


});
