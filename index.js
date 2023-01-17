import { chainRpc,
    chainContract,
    timeout,
    roundTo,
    toWei,
    fromWei,
    numberToHex,
    generateRandomAmount,
    parseFile, 
    sendOptTx,
    sendArbTx,
    dataApprove,
    checkAllowance,
    dataPoolTogether,
    getAmountToken,
    getETHAmount,
    privateToAddress,
    //BRIDGE
    bridgeArbitrumToOptimism,
    getFeeBridgeStargate,
    bridgeUSDCFromPolygonToAvalancheStargate,
    //EXCHANGE
    dataSwapETHToUSDC,
    dataSwapUSDCToETH,
    //SYNAPS
    dataAddLiquiditySynapse,
    dataRemoveLiquiditySynapse,
    //PERPETUAL
    dataDepositPerpetual,
    dataOpenPositionPerpetual,
    getAccountValue, 
    dataClosePositionPerpetual,
    dataWithdrawPerpetual,
    //PIKA
    dataSetAccManager,
    dataCreateOpenPosition,
    getPosition,
    dataCreateClosePosition,
    dataStake,
    //GALAXY
    getClaimNFT,
    callClaimOAT,
    dataClaimNFT,
    dataClaimFreeNFT,
    //OKX
    dataSendToken } from './tools.js';
import { subtract, multiply, divide, chain } from 'mathjs';
import chalk from 'chalk';
import Web3 from 'web3';
import consoleStamp from 'console-stamp';
import readline from 'readline-sync';
import * as dotenv from 'dotenv';
dotenv.config()

consoleStamp(console, { format: ':date(HH:MM:ss)' });
const campaign = [
    { id: 'GC6HiUtSAs', name: 'Stargate' },
    { id: 'GC1ZiUtRRW', name: 'PoolTogether' },
    { id: 'GC6NiUtWQn', name: 'Uniswap' },
    { id: 'GCp8iUtuvp', name: 'Synapse' },
    { id: 'GCmCiUtj6d', name: 'Perpetual' },
    { id: 'GCYUiUtXry', name: 'Pika' }
]

//token mwei
//WETH milliether

const wallet = parseFile('private.txt');
const randomTimeout = generateRandomAmount(1200, 2400, 0);
const randomTimeoutFor = generateRandomAmount(700, 1400, 0);
let status;

status = readline.question(chalk.cyan('Type "Start" for 1 Stage | Type "Start2" for 2 Stage | Type "Claim" for 3 Stage | Type "freeClaim" for FREE NFT: '));
if (status == 'Pool') {
    /*//DEPOSIT POOL
    console.log('APPROVE')
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1}`);
        await dataApprove(chainRpc.Optimism, chainContract.Optimism.USDC, '0x79bc8bd53244bc8a9c8c27509a2d573650a83373').then(async function(res) {
            await sendOptTx(chainRpc.Optimism, 75000, chainContract.Optimism.USDC, null, res, wallet[i]);
        });
    }
    console.log('STAKE')
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1}`);
        await getAmountToken(chainRpc.Optimism, chainContract.Optimism.USDC, privateToAddress(wallet[i])).then(async function(res) {
            await dataPoolTogether(chainRpc.Optimism, res, privateToAddress(wallet[i])).then(async function(res1) {
                await sendOptTx(chainRpc.Optimism, 700000, '0x79bc8bd53244bc8a9c8c27509a2d573650a83373', null, res1, wallet[i]);
            });
        });
    }
    console.log('-'.repeat(40));
    await timeout(2000);*/
} else if (status == 'Start') {
    //ARBITRUM SWAP
    console.log(chalk.yellow('ARBITRUM SWAP ETH TO USDC'));
    const nativeForDst = generateRandomAmount(0.0043, 0.0044, 5);
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        await getETHAmount(chainRpc.Arbitrum, privateToAddress(wallet[i])).then(async function(res) {
            try {
                const feeBridge = await getFeeBridgeStargate(chainRpc.Arbitrum, 111, chainContract.Arbitrum.StargateRouter, 205000, toWei(`${nativeForDst}`, 'ether'), wallet[i]);
                const amountETH = subtract( subtract(res, feeBridge), multiply(5250000, toWei('0.1', 'gwei')) );
                await dataSwapETHToUSDC(chainRpc.Optimism, amountETH, chainContract.Arbitrum.USDC, chainContract.Arbitrum.WETH, wallet[i]).then(async function(res1) {
                    await sendArbTx(chainRpc.Arbitrum, 2000000, chainContract.Arbitrum.UniswapV3, amountETH, res1, wallet[i]);
                });
                await timeout(randomTimeoutFor);
            } catch (err) {
                console.log(`Exchange Error: ${err}`);
            }
        });
    }
    await timeout(randomTimeout);
    //APPROVE
    console.log(chalk.yellow('Approve USDC for Stargate'));
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        await checkAllowance(chainRpc.Arbitrum,
            chainContract.Arbitrum.USDC,
            privateToAddress(wallet[i]),
            chainContract.Arbitrum.StargateRouter).then(async function(res) {
            if (res < toWei('100', 'mwei')) {
                await dataApprove(chainRpc.Arbitrum, chainContract.Arbitrum.USDC, chainContract.Arbitrum.StargateRouter).then(async function(res1) {
                    await sendArbTx(chainRpc.Arbitrum, 750000, chainContract.Arbitrum.USDC, null, res1, wallet[i]);
                });
            }
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(randomTimeout);
    //BRIDGE
    console.log(chalk.yellow('Birdge USDC Stargate'));
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        const feeBridge = await getFeeBridgeStargate(chainRpc.Arbitrum, 111, chainContract.Arbitrum.StargateRouter, 205000, toWei(`${nativeForDst}`, 'ether'), wallet[i]);
        await getAmountToken(chainRpc.Arbitrum, chainContract.Arbitrum.USDC, privateToAddress(wallet[i])).then(async(res) => {
            await bridgeUSDCFromPolygonToAvalancheStargate(chainRpc.Arbitrum, res, 205000, toWei(`${nativeForDst}`, 'ether'), feeBridge, wallet[i]);
        });
        await timeout(randomTimeoutFor);
    }
    console.log(chalk.yellow('Stage 1 END'));
    console.log('-'.repeat(40));
} else if (status == 'Start2') {
    console.log(chalk.yellow('Exchange Quest'));
    //APPROVE USDC FOR UNISWAP
    console.log('Approve USDC [UniswapV3]');
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        await checkAllowance(chainRpc.Optimism,
            chainContract.Optimism.USDC,
            privateToAddress(wallet[i]),
            chainContract.Optimism.UniswapV3).then(async function(res) {
            if (res < toWei('100', 'mwei')) {
                await dataApprove(chainRpc.Optimism, chainContract.Optimism.USDC, chainContract.Optimism.UniswapV3).then(async function(res1) {
                    await sendOptTx(chainRpc.Optimism, 75000, chainContract.Optimism.USDC, null, res1, wallet[i]);
                });
            }
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(randomTimeout);
    //EXCHANGE USDC -> WETH
    console.log('Exchange');
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Exchange USDC -> WETH');
        try {
            const amountUSDC = generateRandomAmount(21, 37, 5);
            await dataSwapUSDCToETH(chainRpc.Optimism, toWei(`${amountUSDC}`, 'mwei'), chainContract.Optimism.USDC, chainContract.Optimism.WETH, wallet[i]).then(async function(res1) {
                await sendOptTx(chainRpc.Optimism, 200000, chainContract.Optimism.UniswapV3, null, res1.dataSwap, wallet[i]);
            });
            await timeout(randomTimeoutFor);
        } catch (err) {
            console.log(`Exchange Error: ${err}`);
        }
    }
    await timeout(randomTimeout);
    //APPROVE WETH
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Approve WETH');
        await checkAllowance(chainRpc.Optimism,
            chainContract.Optimism.WETH,
            privateToAddress(wallet[i]),
            chainContract.Optimism.UniswapV3).then(async function(res) {
            if (res < toWei('1', 'mwei')) {
                await dataApprove(chainRpc.Optimism, chainContract.Optimism.WETH, chainContract.Optimism.UniswapV3).then(async function(res1) {
                    await sendOptTx(chainRpc.Optimism, 75000, chainContract.Optimism.WETH, null, res1, wallet[i]);
                });
            }
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(randomTimeout);
    //EXCHANGE WETH -> USDC
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Exchange WETH -> USDC');
        await getAmountToken(chainRpc.Optimism, chainContract.Optimism.WETH, privateToAddress(wallet[i])).then(async function(res) {
            try {
                await dataSwapETHToUSDC(chainRpc.Optimism, res, chainContract.Optimism.USDC, chainContract.Optimism.WETH, wallet[i]).then(async function(res1) {
                    await sendOptTx(chainRpc.Optimism, 200000, chainContract.Optimism.UniswapV3, null, res1, wallet[i]);
                });
            } catch (err) {
                console.log(`Exchange Error: ${err}`);
            }
        });
        await timeout(randomTimeoutFor);
    }
    console.log('-'.repeat(40));
    await timeout(randomTimeout);

    //SYNAPSE
    console.log(chalk.yellow('SYNAPSE'));
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Approve USDC');
        await checkAllowance(chainRpc.Optimism, chainContract.Optimism.USDC, privateToAddress(wallet[i]), chainContract.Optimism.Synapse).then(async function(res) {
            if (res < toWei('30', 'mwei')) {
                await dataApprove(chainRpc.Optimism, chainContract.Optimism.USDC, chainContract.Optimism.Synapse).then(async function(res1) {
                    await sendOptTx(chainRpc.Optimism, 75000, chainContract.Optimism.USDC, null, res1, wallet[i]);
                });
            }
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(randomTimeout);
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Approve nUSD LP');
        await checkAllowance(chainRpc.Optimism, chainContract.Optimism.nUSDLP, privateToAddress(wallet[i]), chainContract.Optimism.Synapse).then(async function(res) {
            if (res < toWei('30', 'mwei')) {
                await dataApprove(chainRpc.Optimism, chainContract.Optimism.nUSDLP, chainContract.Optimism.Synapse).then(async function(res1) {
                    await sendOptTx(chainRpc.Optimism, 75000, chainContract.Optimism.nUSDLP, null, res1, wallet[i]);
                });
            }
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(randomTimeout);
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Add Liquidity');
        const number = generateRandomAmount(21, 26, 4);
        await dataAddLiquiditySynapse(chainRpc.Optimism, toWei(`${number}`, 'mwei')).then(async function(res) {
            await sendOptTx(chainRpc.Optimism, 200000, chainContract.Optimism.Synapse, null, res, wallet[i]);
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(randomTimeout);
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Remove Liquidity');
        await getAmountToken(chainRpc.Optimism, chainContract.Optimism.nUSDLP, privateToAddress(wallet[i])).then(async function(res) {
            await dataRemoveLiquiditySynapse(chainRpc.Optimism, res).then(async function(res1) {
                await sendOptTx(chainRpc.Optimism, 175000, chainContract.Optimism.Synapse, null, res1, wallet[i]);
            });
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(randomTimeout);
    console.log('-'.repeat(40));

    //PERPUTUAL PROTOCOL
    console.log(chalk.yellow('PERPUTUAL PROTOCOL'));
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Approve USDC');
        await checkAllowance(chainRpc.Optimism,
            chainContract.Optimism.USDC,
            privateToAddress(wallet[i]),
            chainContract.Optimism.PerputalProtocol).then(async function(res) {
            if (res < toWei('100', 'mwei')) {
                await dataApprove(chainRpc.Optimism, chainContract.Optimism.USDC, chainContract.Optimism.PerputalProtocol).then(async function(res1) {
                    await sendOptTx(chainRpc.Optimism, 75000, chainContract.Optimism.USDC, null, res1, wallet[i]);
                });
            }
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(randomTimeout);
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Deposit USDC');
        await getAmountToken(chainRpc.Optimism, chainContract.Optimism.USDC, privateToAddress(wallet[i])).then(async(res) => {
            await dataDepositPerpetual(chainRpc.Optimism, chainContract.Optimism.USDC, res).then(async(res1) => {
                await sendOptTx(chainRpc.Optimism, 150000, chainContract.Optimism.PerputalProtocol, null, res1, wallet[i]);
            });
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(randomTimeout);
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Open position');
        await getAccountValue(chainRpc.Optimism, privateToAddress(wallet[i])).then(async(res) => {
            await dataOpenPositionPerpetual(chainRpc.Optimism, res).then(async(res1) => {
                await sendOptTx(chainRpc.Optimism, 900000, chainContract.Optimism.PerputalMargin, null, res1, wallet[i]);
            });
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(randomTimeout);
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Close position');
        await dataClosePositionPerpetual(chainRpc.Optimism, privateToAddress(wallet[i])).then(async(res) => {
            await sendOptTx(chainRpc.Optimism, 900000, chainContract.Optimism.PerputalMargin, null, res, wallet[i]);
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(randomTimeout);
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Withdraw USDC');
        await getAccountValue(chainRpc.Optimism, privateToAddress(wallet[i])).then(async(res) => {
            await dataWithdrawPerpetual(chainRpc.Optimism, chainContract.Optimism.USDC, parseInt(fromWei(res, 'micro'))).then(async(res1) => {
                await sendOptTx(chainRpc.Optimism, 275000, chainContract.Optimism.PerputalProtocol, null, res1, wallet[i]);
            });
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(randomTimeout);
    console.log('-'.repeat(40));

    //PIKA
    console.log(chalk.yellow('PIKA'));
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Approve USDC for Manager');
        await checkAllowance(chainRpc.Optimism,
            chainContract.Optimism.USDC,
            privateToAddress(wallet[i]),
            chainContract.Optimism.PikaManager).then(async function(res) {
            if (res < toWei('30', 'mwei')) {
                await dataApprove(chainRpc.Optimism, chainContract.Optimism.USDC, chainContract.Optimism.PikaManager).then(async function(res1) {
                    await sendOptTx(chainRpc.Optimism, 75000, chainContract.Optimism.USDC, null, res1, wallet[i]);
                });
            }
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(randomTimeout);
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Set Account Manager');
        await dataSetAccManager().then(async(res) => {
            await sendOptTx(chainRpc.Optimism, 75000, chainContract.Optimism.Pika, null, res, wallet[i]);
        });
    }
    await timeout(randomTimeout);
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Сreate Open Position');
        const amountMargin = multiply(100000000, generateRandomAmount(31, 63, 5));
        await dataCreateOpenPosition(chainRpc.Optimism, amountMargin, true).then(async(res) => {
            await sendOptTx(chainRpc.Optimism, 450000, chainContract.Optimism.PikaManager, toWei('0.00025', 'ether'), res, wallet[i]);
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(generateRandomAmount(21000, 24000, 0));
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Сreate Close Position');
        await getPosition(chainRpc.Optimism, privateToAddress(wallet[i]), true).then(async(res) => {
            await dataCreateClosePosition(chainRpc.Optimism, res, true).then(async(res1) => {
                await sendOptTx(chainRpc.Optimism, 350000, chainContract.Optimism.PikaManager, toWei('0.00025', 'ether'), res1, wallet[i]);
            });
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(randomTimeout);
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Approve USDC for Pika');
        await checkAllowance(chainRpc.Optimism,
            chainContract.Optimism.USDC,
            privateToAddress(wallet[i]),
            chainContract.Optimism.Pika).then(async function(res) {
            if (res < toWei('30', 'mwei')) {
                await dataApprove(chainRpc.Optimism, chainContract.Optimism.USDC, chainContract.Optimism.Pika).then(async function(res1) {
                    await sendOptTx(chainRpc.Optimism, 75000, chainContract.Optimism.USDC, null, res1, wallet[i]);
                });
            }
        });
        await timeout(randomTimeoutFor);
    }
    await timeout(randomTimeout);
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        console.log('Stake Pika');
        const amountMargin = multiply(100000000, generateRandomAmount(30, 33, 5));
        await dataStake(chainRpc.Optimism, amountMargin, privateToAddress(wallet[i])).then(async(res) => {
            await sendOptTx(chainRpc.Optimism, 500000, chainContract.Optimism.Pika, null, res, wallet[i]);
        });
        await timeout(randomTimeoutFor);
    }
    console.log(chalk.yellow('Stage 2 END'));
    console.log('-'.repeat(40));
} else if (status == 'Claim') {
    console.log(chalk.yellow('Claim Galaxy NFT'));
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        for (let s = 0; s < campaign.length; s++) {
            await getClaimNFT(campaign[s].id, privateToAddress(wallet[i])).then(async (res) => {
                if (res.prepareParticipate.allow) {
                    console.log(`Ready to claim ${campaign[s].name} quest`);
                    await dataClaimNFT(chainRpc.Optimism,
                        res.prepareParticipate.mintFuncInfo.powahs[0],
                        res.prepareParticipate.mintFuncInfo.verifyIDs[0],
                        res.prepareParticipate.mintFuncInfo.nftCoreAddress,
                        res.prepareParticipate.signature,
                        res.prepareParticipate.spaceStation).then(async(res1) => {
                        await sendOptTx(chainRpc.Optimism, 150000, chainContract.Optimism.Galaxy, null, res1, wallet[i]);
                    });
                    await timeout(generateRandomAmount(14000, 18000, 0));
                } else if (!res.prepareParticipate.allow) {
                    console.log(`${campaign[s].name} Quest not ready, go to next NFT`);
                }
            });
        }
    }
    console.log(chalk.yellow('Claim Galaxy OAT')); //Perp Shark NFT
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        await callClaimOAT('GCUd9UtEJK', privateToAddress(wallet[i])).then(async(res) => {
            if (res.prepareParticipate.allow) {
                console.log('Claim....');
            } else if (!res.prepareParticipate.allow) {
                console.log('Not Claim');
            }
        });
        await timeout(randomTimeoutFor);
    }
} else if (status == 'freeClaim') {
    console.log(chalk.yellow('Claim Free NFT'));
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])}`);
        const type = generateRandomAmount(1, 4, 0);
        await dataClaimFreeNFT(chainRpc.Optimism, type).then(async(res) => {
            await sendOptTx(chainRpc.Optimism, 200000, chainContract.Optimism.FreeNFTOpt, null, res, wallet[i]);
        });
        await timeout(randomTimeoutFor);
    }
    console.log(chalk.yellow('Stage Claim END'));
    console.log('-'.repeat(40));
} else if (status == 'OKX') {
    console.log(chalk.yellow('SEND ALL USDC TO SUB WALLET OKX'));
    const subWallet = parseFile('subWallet.txt');
    for (let i = 0; i < wallet.length; i++) {
        console.log(`${i+1} ${privateToAddress(wallet[i])} ${subWallet[i]}`);
        await getAmountToken(chainRpc.Optimism, chainContract.Optimism.USDC, privateToAddress(wallet[i])).then(async(res) => {
            //const amount = toWei(`${generateRandomAmount(10, 15, 4)}`, 'mwei');
            res = res;
            await dataSendToken(chainRpc.Optimism, chainContract.Optimism.USDC, subWallet[i], res).then(async(res) => {
                await sendOptTx(chainRpc.Optimism, 200000, chainContract.Optimism.USDC, null, res, wallet[i]);
            });
            await timeout(randomTimeoutFor);
        });
    }
}