

import React from 'react';
import { ethers } from 'ethers';

import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import Box from '@material-ui/core/Box';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';

import SimpleModal from '../components/SimpleModal'


import {
    useWeb3React,
    UnsupportedChainIdError
} from "@web3-react/core";

const useStyles = makeStyles((theme) => ({
    buttonContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '1.5%',
    },
}));

export default function RedeemButton({ xDittoContract, dittoContract, inputXDitto }) {
    const classes = useStyles();
    const context = useWeb3React();
    const {
        connector,
        library,
        chainId,
        account,
        activate,
        deactivate,
        active,
        error
    } = context;

    const [xDittoAllowanceAmount, setXDittoAllowanceAmount] = React.useState('0');
    const [approvalLoading, setApprovalLoading] = React.useState(false);
    const [redeemLoading, setRedeemLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [modalOpen, setModalOpen] = React.useState(false);

    React.useEffect(() => {

        const getAllowanceAmount = async () => {
            const xDittoAllowance = await xDittoContract.allowance(account, xDittoContract.address);
            const formattedXDittoAllowance = ethers.utils.formatUnits(xDittoAllowance, 18);
            setXDittoAllowanceAmount(formattedXDittoAllowance);
        }

        if (xDittoContract)
            getAllowanceAmount();

    }, [xDittoContract, dittoContract])

    const showError = async (message) => {
        setErrorMessage(message);
        await new Promise(r => setTimeout(r, 5000));
        setErrorMessage('');
    }

    const approveRedeem = async () => {
        const amountToApprove = ethers.utils.parseUnits(`1000000000000000000000000.0`, 9);
        setApprovalLoading(true);
        try {
            const approvalTx = await xDittoContract.approve(xDittoContract.address, amountToApprove);
            await approvalTx.wait();
            getAllowanceAmount();
        } catch (error) {
            console.error(error)
        }
        setApprovalLoading(false);
    }

    const redeem = async () => {
        const inputXDittoToRedeemWith = ethers.utils.parseUnits(inputXDitto, 18);
        console.log(inputXDitto, inputXDittoToRedeemWith)
        setRedeemLoading(true);
        try {
            console.log('1')
            const redeemTx = await xDittoContract.burn(inputXDittoToRedeemWith);
            console.log('2')
            await redeemTx.wait();
            setModalOpen(true);
        } catch (error) {
            console.error(error);
            if (error.message.includes('MetaMask Tx Signature: User denied transaction signature.'))
                showError('Transaction cancelled.');
        }
        setRedeemLoading(false);
    }


    if (account === undefined || account === null) {
        return (
            <Box className={classes.buttonContainer} >
                <Button type="button">Connect wallet to BSC mainnet to continue</Button>
            </Box>
        );
    }

    if (parseInt(inputXDitto) === 0 || inputXDitto === undefined || inputXDitto === '') {
        return (
            <Box className={classes.buttonContainer} >
                <Button type="button">Enter an amount</Button>
            </Box>
        )
    }

    if (approvalLoading) {
        return (
            <Box className={classes.buttonContainer} >
                <Button type="button" variant="contained" color="primary" size="large">
                    <Box paddingRight={2} paddingTop={1}>
                        <CircularProgress color="white" size={20} />
                    </Box>
                    Approval loading
                </Button >
            </Box>
        )
    }

    if (parseInt(xDittoAllowanceAmount) === 0) {
        return (
            <Box className={classes.buttonContainer} >
                <Button type="button" variant="contained" color="primary" size="large" onClick={() => {
                    approveRedeem();
                }}> Approve Redeem</Button >
            </Box>
        )
    }

    if (redeemLoading) {
        return (
            <Button type="button" variant="contained" color="primary" size="large" > <CircularProgress color="#ffffff" /> Redeeming</Button >
        )
    }

    return (
        <Box className={classes.buttonContainer} >
            <div>
                <Button type="button" variant="contained" color="primary" size="large" onClick={() => {
                    redeem();
                }}> Redeem</Button>
            </div>
            {errorMessage && <Typography>{errorMessage}</Typography>}
            <SimpleModal open={modalOpen} setModalOpen={setModalOpen} heading={'test'} bodyText={'test'} />
        </Box>
    );
};