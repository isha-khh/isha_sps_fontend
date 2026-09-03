
//至少一個英文大小寫+至少一個數字+至少一個特殊符號
function PwdValidator(str) {
    var regExp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{10,20}$/;
    if (regExp.test(str))
        return true;
    else
        return false;
}

//頭尾字元為特殊符號
function SpecialSymbolsValidator(str) {
    var regExp1 = /^(\W)(.*)$/;
    var regExp2 = /^(.*)(\W)$/;
    if (regExp1.test(str) || regExp2.test(str))
        return false;
    else
        return true;
}