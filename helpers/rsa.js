'use strict';

const bigInt = require('big-integer');

const generateRandomKeys = (bitLength = 256, publicExponent = 65537) => {
    const base = bigInt(2);
    const e = bigInt(publicExponent);
    let p=bigInt.zero, q=bigInt.zero;

    while (!bigInt(p).isPrime()) {
        p = bigInt.randBetween(base.pow(bitLength), base.pow(bitLength + 1).subtract(1));
    }
    while (!bigInt(q).isPrime()) {
        q = bigInt.randBetween(base.pow(bitLength), base.pow(bitLength + 1).subtract(1));
    }
    const phi = p.subtract(1).multiply(q.subtract(1));
    const n = p.multiply(q);
    const d = e.modInv(phi);
    console.log('RSA Server Keys Generated');
    const publicKey = new PublicKeyRSA(e, n);
    const privateKey = new PrivateKeyRSA(d, publicKey);
    return { publicKey: publicKey, privateKey: privateKey };
};

const PublicKeyRSA = class PublicKeyRSA {
    constructor(e, n) {
        this.e = bigInt(e);
        this.n = bigInt(n);
    }
    get bitLength() {
        return this.n.bitLength();
    }
    encrypt(m) {
        return bigInt(m).modPow(this.e,this.n);
    }
    verify(s) {
        return bigInt(s).modPow(this.e,this.n);
    }
};

const PrivateKeyRSA = class PrivateKeyRSA {
    constructor(d, publicKey) {
        this.d = bigInt(d);
        this.publicKey = publicKey;
    }
    get bitLength() {
        return this.publicKey.n.bitLength();
    }
    get n() {
        return this.publicKey.n;
    }
    decrypt(c) {
        return bigInt(c).modPow(this.d,this.publicKey.n);
    }
    sign(c) {
        return bigInt(c).modPow(this.d,this.publicKey.n);
    }
};

module.exports = {
    generateRandomKeys: generateRandomKeys,
    PrivateKeyRSA: PrivateKeyRSA,
    PublicKeyRSA: PublicKeyRSA
};