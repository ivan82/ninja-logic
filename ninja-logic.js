var NinjaLogic = {
	compile: function(logic, data){
		var logicObject = this.getLogicObject(logic);
		return this.evalueate(logicObject, data);
	},

	//and = &&, or = ||, xor = &|, |&
	getLogicObject: function(logic){
		if(!logic || logic.length === 0){ return; }

		var logicRight, left, operator, right;
		var logicMatch = logic.match(/\s*(.+?)\s*([&|]{2})/);

		if(logicMatch){
			logicRight = logic.substring(logicMatch[0].length);
			left = logicMatch[1];
			operator = logicMatch[2];
			right = this.getLogicObject(logicRight);
		}else if(logic.length > 0){
			left = logic.trim();
		}
		return this.createLogicObject(left, operator, right);
	},

	createLogicObject: function(left, operator, right){
		if(left && left.length === 0){ left = undefined; }
		if(operator && operator.length === 0){ operator = undefined; }
		if(right && right.length === 0){ right = undefined; }
		if(!left && !right){ return; }

		return {
			left: left,
			leftConditionObject: this.getConditionObject(left),
			operator: operator,
			rightLogicObject: right
		};
	},

	evalueate: function(logicObject, data){
		var ref = logicObject;
		var logicValue, conditionValue, conditionOperator, prevConditionValue, prevConditionOperator;
		var first = true;

		do{
			conditionValue = this.getConditionObjectValue(ref.leftConditionObject, data);
			conditionOperator = ref.operator;

			if(first){
				first = false;
				logicValue = conditionValue;
			}else{
				logicValue = this.conditionFullfilled(prevConditionValue, prevConditionOperator, conditionValue);
				if(!(prevConditionValue || logicValue) && prevConditionOperator === '&&'){
					break;
				}
			}

			prevConditionValue = logicValue;
			prevConditionOperator = conditionOperator;
			ref = ref.rightLogicObject;
		}while(ref);
		return logicValue;
	},


	getConditionObject: function(condition){
		if(!condition){ return; }
		var conditionMatch = condition.split(/\s*(==|<=|>=|!=|<|>|=)\s*/);
		if(conditionMatch.length === 3){
			return this.createConditionObject(conditionMatch[0], conditionMatch[1], conditionMatch[2]);
		}else if(conditionMatch.length === 1){
			return this.createConditionObject(conditionMatch[0]);
		}
	},

	getConditionObjectValue: function(conditionObject, data){
		var leftValue = this.convertToValue(conditionObject.left, data);
		var rightValue = this.convertToValue(conditionObject.right, data);

		return this.conditionFullfilled(leftValue, conditionObject.operator, rightValue, conditionObject.neglect);
	},

	createConditionObject: function(left, operator, right){
		return{
			left: left,
			operator: operator,
			right: right,
			neglect: left ? left.trim().charAt(0) === '!' : false,
			isAssingment: operator === '=',
			isSingle: left !== undefined && right === undefined,
			canCompare:  operator !== undefined && right !== undefined
		};
	},


	conditionFullfilled: function(left, operator, right, neglect){
		var isTrue = false;
		if(!operator){
			isTrue = this.isTrue(left);
		}else if(operator === '&&'){
			isTrue = left && right;
		}else if(operator === '||'){
			isTrue = left || right;
		}else if(operator === '|&' || operator === '&|'){
			isTrue = (left || right) && !(left && right);
		}else if(operator === '=='){
			isTrue = left === right;
		}else if(operator === '!='){
			isTrue = left !== right;
		}else if(operator === '>='){
			isTrue = left >= right;
		}else if(operator === '<='){
			isTrue = left <= right;
		}else if(operator === '>'){
			isTrue = left > right;
		}else if(operator === '<'){
			isTrue = left < right;
		}

		return neglect ? !isTrue : isTrue;
	},

	removeStringQuotes: function(value){ return value.substring(1, value.length - 1); },
	isConstant: function(value){ return /'.*'|".*"|\d+|true|false/i.test(value); },
	isString: function(value){ return /^'|"/.test(value); },
	isNumber: function(value){ return /\d+/.test(value); },
	isBool: function(value){ return /true|false/i.test(value); },
	isTrue: function(value){
		if(value === undefined || value === null || value === false || value === 0){ return false; }
		return true;
	},

	convertToValue: function(property, data){
		if(/^null$/i.test(property)){ return null; }
		if(/^undefined$/i.test(property)){ return undefined; }
		if(this.isConstant(property)){
			property = property.trim();
			if(this.isString(property)){
				return this.removeStringQuotes(property);
			}else if(this.isNumber(property)){
				return parseInt(property);
			}else if(this.isBool(property)){
				return Boolean(property);
			}
			return property;
		}

		return NinjaProperty.value(data, property);
	}
};
