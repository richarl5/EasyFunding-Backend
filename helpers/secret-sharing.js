'use strict';

const bigInt = require('big-integer');

const construction = (t,n,k,p) => {
    let coeff = new Array(0);
    if (bigInt(t.toString()).compareTo(bigInt(n.toString())) > 0) throw 't is not < n!';
    else {

        for(let i=1; i<t; i++){
            let a;
            do{
                a = bigInt.randBetween(bigInt(2).pow(255), bigInt(2).pow(256));
                console.log(bigInt(a).compareTo(bigInt(p))+'\n'+bigInt(a).isPrime());
            } while (bigInt(a).eq(0) && bigInt(a).compareTo(bigInt(p)) > 0 && bigInt(a).isPrime());
            coeff.push(a.toString())
        }
        coeff.push(k.toString());
        let keys = distribution(coeff,n,p);
        return {keys: keys, p: p};
    }
};

const recovery =  function (keys , p) {
    let coef = [];
    p = bigInt(p);

    for (let i = 0; i < keys.length; i++) {
        let numerator = bigInt(1);
        let denominator = bigInt(1);
        let j = 0;
        keys.reduce((sum, next) => {
            if (j !== i) {
                const xTemp = bigInt(next.x);
                const xoTemp = bigInt(keys[i].x);
                const sub = xTemp.subtract(xoTemp);
                numerator = numerator.multiply(xTemp);
                denominator = denominator.multiply(sub);
            }

            j++;
            return 1;
        }, 1);

        numerator = numerator.multiply(bigInt(keys[i].key));
        while (denominator.lt(bigInt(0))) {
            denominator = denominator.add(p);
        }
        const inv = denominator.modInv(p);
        coef.push((numerator.multiply(inv)).mod(p));
    }

    const sTemp = coef.reduce((sum, next) => {
        return sum.add(next);
    });
    let resp = sTemp.mod(p);
    return resp.toString();
};

const horner = (poly,n,x) => {
    let result = bigInt(poly[0]);

    for (let i = 1; i < n; i = (i + 1) | 0) {
        result = bigInt(result).multiply(bigInt(x)).add(bigInt(poly[i]));
    }

    return result.toString();
};

const distribution = (pol,n,p) => {
    let keys = new Array(bigInt(n).toString());
    let i;
    for (i=0; i<n; i++){
        //keys[i] = (bigInt(pol.eval(i+1)).mod(p).toString());
        keys[i] = (bigInt(horner(pol,pol.length,i+1)).mod(p).toString());
    }
    let treskeys = new Array(0);
    for (let i=0;i<keys.length;++i) treskeys.push({key:keys[i], id:(i+1)});
    return treskeys;
};

function getprime(bitlength) {
    let prime = bigInt(4);
    while (!bigInt(prime).isPrime()) {
        prime = bigInt.randBetween(bigInt(2).pow(bitlength), bigInt(2).pow(bitlength+1));
    }
    return prime;
}

const SecretSharing = class SecretSharing {
    constructor() {}
    getShares(t, n, secret) {
        this.t = bigInt(t);
        this.n = bigInt(n);
        this.secret = bigInt(secret,16);
        this.p = getprime(this.secret.bitLength());
        return construction(this.t,this.n,this.secret,this.p);
    }
    secretRecovery(keys, p) {
        return recovery(keys, p);
    }
};

module.exports = {
    SecretSharing: SecretSharing
};