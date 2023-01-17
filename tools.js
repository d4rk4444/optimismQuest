import Web3 from 'web3';
import { abiToken,
    abiGalaxy,
    abiPoolTogether,
    abiUniswapV3,
    abiStargate,
    abiSynapse,
    abiPika, 
    abiPerpetual } from './abi.js';
import { ethers } from 'ethers';
import { subtract, multiply, divide, add } from 'mathjs';
import { request, gql, GraphQLClient } from 'graphql-request';
import fs from 'fs';

export const chainRpc = {
    Arbitrum: 'https://arb1.arbitrum.io/rpc',
    Optimism: 'https://rpc.ankr.com/optimism',
}

export const chainExplorerTx = {
    Arbitrum: 'https://arbiscan.io/tx/',
    Optimism: 'https://optimistic.etherscan.io/tx/',
}

export const chainContract = {
    Optimism: {
        WETH: '0x4200000000000000000000000000000000000006',
        USDC: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
        Galaxy: '0x2e42f214467f647fe687fd9a2bf3baddfa737465',
        FreeNFTOpt: '0x81b30ff521d1feb67ede32db726d95714eb00637',
        UniswapV3: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        QueryUniswap: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
        PoolTogether: '0x79bc8bd53244bc8a9c8c27509a2d573650a83373',
        Synapse: '0xf44938b0125a6662f9536281ad2cd6c499f22004',
        nUSDLP: '0x2c6d91accC5Aa38c84653F28A80AEC69325BDd12',
        Pika: '0xd5a8f233cbddb40368d55c3320644fb36e597002',
        PikaManager: '0x8add31bc901214a37f3bb676cb90ad62b24fd9a5',
        PikaOracle: '0xDb4174E1A4005a30f5A0924f43c8dfCB8cbD828A',
        PikaBTCUSD: '0xD702DD976Fb76Fffc2D3963D037dfDae5b04E593',
        PerputalProtocol: '0xAD7b4C162707E0B2b5f6fdDbD3f8538A5fbA0d60',
        PerputalMargin: '0x82ac2CE43e33683c58BE4cDc40975E73aA50f459',
        PerputalPosition: '0xA7f3FC32043757039d5e13d790EE43edBcBa8b7c',
        PerputalVBTC: '0x86f1e0420c26a858fc203A3645dD1A36868F18e5',
    },
    Arbitrum: {
        UniswapV3: '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
        WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        ArbitrumWETHUSDCLP: '0x7eC3717f70894F6d9BA0be00774610394Ce006eE',
        StargateRouter: '0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614',
    },
    approveAmount: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
}

//-----------------------------------------------------------------------------------------------------

export const timeout = ms => new Promise(res => setTimeout(res, ms));

export const roundTo = (num, amount) => +(Math.round(num + `e+${amount}`)  + `e-${amount}`);

export const toWei = (amount, type) => {
    const w3 = new Web3();
    return w3.utils.toWei(amount, type);
}
export const fromWei = (amount, type) => {
    const w3 = new Web3();
    return w3.utils.fromWei(amount, type);
}
export const numberToHex = (amount) => {
    const w3 = new Web3();
    return w3.utils.numberToHex(amount);
}

export const generateRandomAmount = (min, max, num) => {
    const amount = Number(Math.random() * (max - min) + min);
    return Number(parseFloat(amount).toFixed(num));
}

export const parseFile = (file) => {
    let data = fs.readFileSync(file, "utf8");
    let array = data.split('\n');
    return array;
}

export const privateToAddress = (privateKey) => {
    const w3 = new Web3();
    return w3.eth.accounts.privateKeyToAccount(privateKey).address;
}

export const getAmountToken = async (rpc, tokenAddress, walletAddress) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const token = new w3.eth.Contract(abiToken, w3.utils.toChecksumAddress(tokenAddress));

    const data = await token.methods.balanceOf(
        walletAddress
    ).call();

    return data;
}

export const getETHAmount = async (rpc, walletAddress) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const data = await w3.eth.getBalance(walletAddress);
    return data;
}

export const dataApprove = async (rpc, tokenAddress, contractAddress) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiToken, w3.utils.toChecksumAddress(tokenAddress));

    const data = await contract.methods.approve(
        contractAddress,
        chainContract.approveAmount,
    ).encodeABI();

    return data;
}

export const checkAllowance = async (rpc, tokenAddress, owner, spender) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const token = new w3.eth.Contract(abiToken, w3.utils.toChecksumAddress(tokenAddress));

    const data = await token.methods.allowance(
        owner,
        spender
    ).call();

    return data;
}

export const sendOptTx = async (rpc, gasLimit, toAddress, value, data, privateKey) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const wallet = w3.eth.accounts.privateKeyToAccount(privateKey).address;

    const tx = {
        'from': wallet,
        'gas': gasLimit,
        'gasPrice': w3.utils.toWei('0.001', 'gwei'),
        'chainId': w3.eth.getChainId(),
        'to': toAddress,
        'nonce': await w3.eth.getTransactionCount(wallet),
        'value': value,
        'data': data
    };
    
    const signedTx = await w3.eth.accounts.signTransaction(tx, privateKey);
    await w3.eth.sendSignedTransaction(signedTx.rawTransaction, async function(error, hash) {
        if (!error) {
            console.log(`Optimism TX: ${chainExplorerTx.Optimism + hash}`);
        } else {
            console.log(`Error Tx: ${error}`);
        }
    });
}

export const sendArbTx = async (rpc, gasLimit, toAddress, value, data, privateKey) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const wallet = w3.eth.accounts.privateKeyToAccount(privateKey).address;

    const tx = {
        'from': wallet,
        'gas': gasLimit,
        'baseFeePerGas': w3.utils.toWei('0.1', 'gwei'),
        'chainId': w3.eth.getChainId(),
        'to': toAddress,
        'nonce': await w3.eth.getTransactionCount(wallet),
        'value': value,
        'data': data
    };
    
    const signedTx = await w3.eth.accounts.signTransaction(tx, privateKey);
    await w3.eth.sendSignedTransaction(signedTx.rawTransaction, async function(error, hash) {
        if (!error) {
            console.log(`Arbitrum TX: ${chainExplorerTx.Arbitrum + hash}`);
        } else {
            console.log(`Error Tx: ${error}`);
        }
    });
}

//OKX
//-----------------------------------------------------------------------------------------------------
export const dataSendToken = async (rpc, tokenAddress, toAddress, amount) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiToken, w3.utils.toChecksumAddress(tokenAddress));

    const data = await contract.methods.transfer(
        toAddress,
        amount
    ).encodeABI();

    return data;
}

//POOL TOGETHER
//-----------------------------------------------------------------------------------------------------
export const dataPoolTogether = async (rpc, amount, address) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiPoolTogether, w3.utils.toChecksumAddress('0x79bc8bd53244bc8a9c8c27509a2d573650a83373'));

    const data = await contract.methods.depositToAndDelegate(
        address,
        amount,
        address
    ).encodeABI();

    return data;
}

//BRIDGE ETH ARBITRUM -> OPTIMISM
//-----------------------------------------------------------------------------------------------------
export const bridgeArbitrumToOptimism = async (rpc, amountMwei, privateKey) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    
    const wallet = w3.eth.accounts.privateKeyToAccount(privateKey).address;
    const router = '0xbf22f0f184bCcbeA268dF387a49fF5238dD23E40';
    const bridge = new w3.eth.Contract(abiStargate, w3.utils.toChecksumAddress(router));
    const gasLimit = generateRandomAmount(1200000, 1400000, 0);
    const amount = subtract( subtract(subtract(amountMwei, generateRandomAmount(50, 150, 0)), multiply(gasLimit, w3.utils.toWei('0.1', 'gwei'))), w3.utils.toWei('0.0007', 'ether') );

    const data = await bridge.methods.swapETH(
        111,
        wallet,
        wallet,
        w3.utils.numberToHex(amount),
        w3.utils.toHex(parseInt(multiply(amount, 0.995))),
    );

    const tx = {
        'from': wallet,
        'gas': 1200000,
        'baseFeePerGas': w3.utils.toWei('0.1', 'gwei'),
        'chainId': w3.eth.getChainId(),
        'to': router,
        'nonce': await w3.eth.getTransactionCount(wallet),
        'value': add(amount, w3.utils.toWei('0.0007', 'ether')),
        'data': data.encodeABI()
    };
    
    const signedTx = await w3.eth.accounts.signTransaction(tx, privateKey);
    await w3.eth.sendSignedTransaction(signedTx.rawTransaction, async function(error, hash) {
        if (!error) {
            console.log(`Bridge ETH to Optimism: ${chainExplorerTx.Arbitrum + hash}`);
        } else {
            console.log(`Error Tx: ${error}`);
        }
    });
}

export const getFeeBridgeStargate = async (rpc, toChainId, routerAddress, gasAmountLZ, nativeForDstLZ, privateKey) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    
    const wallet = w3.eth.accounts.privateKeyToAccount(privateKey).address;
    const bridge = new w3.eth.Contract(abiStargate, w3.utils.toChecksumAddress(routerAddress));

    const data = await bridge.methods.quoteLayerZeroFee(
        toChainId,
        1,
        wallet,
        '0x',
        [gasAmountLZ, w3.utils.toHex(nativeForDstLZ), wallet]
    ).call();

    return data.nativeFee;
}

export const bridgeUSDCFromPolygonToAvalancheStargate = async (rpc, amountUSDCMwei, gasAmountLZ, nativeForDstLZ, valueForTx, privateKey) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    
    const wallet = w3.eth.accounts.privateKeyToAccount(privateKey).address;
    const router = chainContract.Arbitrum.StargateRouter;
    const bridge = new w3.eth.Contract(abiStargate, w3.utils.toChecksumAddress(router));

    const data = await bridge.methods.swap(
        111,
        1,
        1,
        wallet,
        amountUSDCMwei,
        w3.utils.toBN(parseInt(multiply(amountUSDCMwei, 0.99))),
        [gasAmountLZ, nativeForDstLZ, wallet],
        wallet,
        '0x'
    );

    const tx = {
        'from': wallet,
        'gas': 1850000,
        'baseFeePerGas': w3.utils.toWei('0.1', 'gwei'),
        'chainId': w3.eth.getChainId(),
        'to': router,
        'nonce': await w3.eth.getTransactionCount(wallet),
        'value': valueForTx,
        'data': data.encodeABI()
    };
    
    const signedTx = await w3.eth.accounts.signTransaction(tx, privateKey);
    await w3.eth.sendSignedTransaction(signedTx.rawTransaction, async function(error, hash) {
        if (!error) {
            console.log(`Bridge USDC to Optimism: ${chainExplorerTx.Arbitrum + hash}`);
        } else {
            console.log(`Error Tx: ${error}`);
        }
    });
}

//EXCHANGE ETH
//-----------------------------------------------------------------------------------------------------
export const dataSwapETHToUSDC = async (rpc, amountWETH, addressUSDC, addressWETH, privateKey) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const wallet = w3.eth.accounts.privateKeyToAccount(privateKey).address;
    const contractQuote = new w3.eth.Contract(abiUniswapV3, w3.utils.toChecksumAddress('0x61fFE014bA17989E743c5F6cB21bF9697530B21e'));
    const contractSwap = new w3.eth.Contract(abiUniswapV3, w3.utils.toChecksumAddress('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'));
    const deadline = Date.now() + 5 * 60 * 1000;

    const dataQuote = await contractQuote.methods.quoteExactInputSingle(
        [chainContract.Optimism.WETH,
        chainContract.Optimism.USDC,
        w3.utils.numberToHex(amountWETH),
        500,
        '0x00']
    ).call();

    const dataExact = await contractSwap.methods.exactInputSingle(
        [addressWETH,
        addressUSDC,
        500,
        wallet,
        w3.utils.numberToHex(amountWETH),
        w3.utils.numberToHex(parseInt(multiply(dataQuote.amountOut, 0.98))),
        '0x00']
    ).encodeABI();

    const dataSwap = await contractSwap.methods.multicall(
        deadline,
        [dataExact]
    ).encodeABI();

    return dataSwap;
}

export const dataSwapUSDCToETH = async (rpc, amountUSDC, addressUSDC, addressWETH, privateKey) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const wallet = w3.eth.accounts.privateKeyToAccount(privateKey).address;
    const contractQuote = new w3.eth.Contract(abiUniswapV3, w3.utils.toChecksumAddress('0x61fFE014bA17989E743c5F6cB21bF9697530B21e'));
    const contractSwap = new w3.eth.Contract(abiUniswapV3, w3.utils.toChecksumAddress('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'));
    const deadline = Date.now() + 5 * 60 * 1000;

    const dataQuote = await contractQuote.methods.quoteExactInputSingle(
        [chainContract.Optimism.USDC,
        chainContract.Optimism.WETH,
        w3.utils.numberToHex(amountUSDC),
        500,
        '0x00']
    ).call();
    const amountETH = dataQuote.amountOut;

    const dataExact = await contractSwap.methods.exactInputSingle(
        [addressUSDC,
        addressWETH,
        500,
        wallet,
        w3.utils.numberToHex(amountUSDC),
        w3.utils.numberToHex(parseInt(multiply(amountETH, 0.985))),
        '0x00']
    ).encodeABI();

    const dataSwap = await contractSwap.methods.multicall(
        deadline,
        [dataExact]
    ).encodeABI();

    return { dataSwap, amountETH };
}

//SYNAPS
//-----------------------------------------------------------------------------------------------------
export const dataAddLiquiditySynapse = async (rpc, amount) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiSynapse, w3.utils.toChecksumAddress(chainContract.Optimism.Synapse));
    const deadline = Date.now() + 5 * 60 * 1000;

    const data = await contract.methods.addLiquidity(
        [0, amount],
        0,
        deadline
    ).encodeABI();

    return data;
}

export const dataRemoveLiquiditySynapse = async (rpc, amountMilli) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiSynapse, w3.utils.toChecksumAddress(chainContract.Optimism.Synapse));
    const deadline = Date.now() + 5 * 60 * 1000;

    const data = await contract.methods.removeLiquidityOneToken(
        amountMilli,
        1,
        parseInt(w3.utils.fromWei(amountMilli, 'micro')),
        deadline
    ).encodeABI();

    return data;
}

//PIKA
//-----------------------------------------------------------------------------------------------------
export const dataSetAccManager = async() => {
    return '0x7f47a1020000000000000000000000008add31bc901214a37f3bb676cb90ad62b24fd9a50000000000000000000000000000000000000000000000000000000000000001';
}

export const getPrice = async(rpc) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiPika, w3.utils.toChecksumAddress(chainContract.Optimism.PikaOracle));

    const data = await contract.methods.getPrice(
        chainContract.Optimism.PikaBTCUSD
    ).call();

    return data;
}

export const dataCreateOpenPosition = async(rpc, marginAmount8decimal, isLong) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiPika, w3.utils.toChecksumAddress(chainContract.Optimism.PikaManager));
    const priceBtc = parseInt( multiply(1.005, await getPrice(rpc)) );

    const data = await contract.methods.createOpenPosition(
        2,
        w3.utils.numberToHex(marginAmount8decimal),
        100000000,
        isLong,
        w3.utils.numberToHex(priceBtc),
        25000
    ).encodeABI();

    return data;
}

export const getPosition = async(rpc, address, isLong) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiPika, w3.utils.toChecksumAddress(chainContract.Optimism.Pika));

    const data = await contract.methods.getPosition(
        address,
        2,
        isLong
    ).call();

    return data.margin;
}

export const dataCreateClosePosition = async(rpc, amount, isLong) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiPika, w3.utils.toChecksumAddress(chainContract.Optimism.PikaManager));
    const priceBtc = multiply(0.995, await getPrice(rpc));

    const data = await contract.methods.createClosePosition(
        2,
        w3.utils.numberToHex(amount),
        isLong,
        priceBtc,
        25000
    ).encodeABI();

    return data;
}

export const dataStake = async(rpc, amount8decimal, userAddress) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiPika, w3.utils.toChecksumAddress(chainContract.Optimism.Pika));

    const data = await contract.methods.stake(
        amount8decimal,
        userAddress,
    ).encodeABI();

    return data;
}

//PERPETUAL PROTOCOL
//-----------------------------------------------------------------------------------------------------
export const dataDepositPerpetual = async(rpc, tokenAddress, amount) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiPerpetual, w3.utils.toChecksumAddress(chainContract.Optimism.PerputalProtocol));

    const data = await contract.methods.deposit(
        tokenAddress,
        amount,
    ).encodeABI();

    return data;
}

export const dataWithdrawPerpetual = async(rpc, tokenAddress, amount) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiPerpetual, w3.utils.toChecksumAddress(chainContract.Optimism.PerputalProtocol));

    const data = await contract.methods.withdraw(
        tokenAddress,
        amount,
    ).encodeABI();

    return data;
}

export const getVBTCPrice = async(rpc) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiPerpetual, w3.utils.toChecksumAddress(chainContract.Optimism.PerputalVBTC));

    const data = await contract.methods.getIndexPrice(
        1
    ).call();

    return data;
}

export const getAccountValue = async(rpc, address) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiPerpetual, w3.utils.toChecksumAddress(chainContract.Optimism.PerputalMargin));

    const data = await contract.methods.getAccountValue(
        address
    ).call();

    return data;
}

export const dataOpenPositionPerpetual = async(rpc, amountUSDCEther) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiPerpetual, w3.utils.toChecksumAddress(chainContract.Optimism.PerputalMargin));
    const amountVBTC = parseInt( divide( amountUSDCEther, multiply(1.01, w3.utils.fromWei(await getVBTCPrice(rpc), 'ether')) ) );

    const data = await contract.methods.openPosition(
        [chainContract.Optimism.PerputalVBTC,
        false,
        true,
        w3.utils.numberToHex(amountUSDCEther),
        w3.utils.numberToHex(amountVBTC),
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        0,
        '0x0000000000000000000000000000000000000000000000000000000000000000']
    ).encodeABI();

    return data;
}

export const getVBTCPositionSize = async(rpc, address) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiPerpetual, w3.utils.toChecksumAddress(chainContract.Optimism.PerputalPosition));

    const data = await contract.methods.getTotalPositionSize(
        address,
        chainContract.Optimism.PerputalVBTC
    ).call();

    return data;
}

export const dataClosePositionPerpetual = async(rpc, address) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiPerpetual, w3.utils.toChecksumAddress(chainContract.Optimism.PerputalMargin));
    const amountVUSD = parseInt( multiply( await getVBTCPositionSize(rpc, address), multiply(w3.utils.fromWei(await getVBTCPrice(rpc), 'ether'), 0.99) ) ) ;


    const data = await contract.methods.closePosition(
        [chainContract.Optimism.PerputalVBTC,
        0,
        w3.utils.numberToHex(amountVUSD),
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        '0x0000000000000000000000000000000000000000000000000000000000000000']
    ).encodeABI();

    return data;
}

//CLAIM NFT
//-----------------------------------------------------------------------------------------------------
export const getClaimNFT = async (campaignID, address) => {
    const graphQLClient = new GraphQLClient('https://graphigo.prd.galaxy.eco/query');
    const query = gql`
        mutation claim {
            prepareParticipate(
                input: {signature: "", campaignID: "${campaignID}", address: "${address}"}
            ) {
                allow
                disallowReason
                signature
                spaceStation
                mintFuncInfo {
                    cap
                    powahs
                    verifyIDs
                    nftCoreAddress
                }
            }
        }
    `;
    const result = await graphQLClient.request(query);

    return result;
}

export const callClaimOAT = async (campaignID, address) => {
    const graphQLClient = new GraphQLClient('https://graphigo.prd.galaxy.eco/query');
    const query = gql`
        mutation claim {
            prepareParticipate(input: {
            signature:  ""
            campaignID: "${campaignID}"
            address:    "${address}"
            }) {
                allow              # Is allow user claim nft
                disallowReason     # Disallow reason
            }
        }
    `;
    const result = await graphQLClient.request(query);

    return result;
}

export const dataClaimNFT = async (rpc, powahs, verifyIDs, nftCoreAddress, signature, contractAddress) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiGalaxy, w3.utils.toChecksumAddress(contractAddress));

    const data = await contract.methods.claim(
        powahs,
        nftCoreAddress,
        verifyIDs,
        powahs,
        signature
    ).encodeABI();

    return data;
}

export const dataClaimFreeNFT = async (rpc, type) => {
    const w3 = new Web3(new Web3.providers.HttpProvider(rpc));
    const contract = new w3.eth.Contract(abiGalaxy, w3.utils.toChecksumAddress(chainContract.Optimism.FreeNFTOpt));

    const data = await contract.methods.mintToken(
        type
    ).encodeABI();

    return data;
}