

import React from 'react';
import { ethers } from 'ethers';

import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

import Box from '@material-ui/core/Box';
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

export default function FormButton({ xDittoContract, dittoContract, inputDitto }) {
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

    const [dittoAllowanceAmount, setDittoAllowanceAmount] = React.useState('0');
    const [approvalLoading, setApprovalLoading] = React.useState(false);
    const [mintLoading, setMintLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [modalOpen, setModalOpen] = React.useState(false);

    React.useEffect(() => {

        const getAllowanceAmount = async () => {
            const dittoAllowance = await dittoContract.allowance(account, xDittoContract.address);
            const formattedDittoAllowance = ethers.utils.formatUnits(dittoAllowance, 9);
            setDittoAllowanceAmount(formattedDittoAllowance);
        }
        if (dittoContract)
            getAllowanceAmount();

    }, [xDittoContract, dittoContract])

    const showError = async (message) => {
        setErrorMessage(message);
        await new Promise(r => setTimeout(r, 5000));
        setErrorMessage('');
    }

    const approveMint = async () => {
        const amountToApprove = ethers.utils.parseUnits(`1000000000000000000000000.0`, 9);
        setApprovalLoading(true);
        try {
            const approvalTx = await dittoContract.approve(xDittoContract.address, amountToApprove);
            await approvalTx.wait();
        } catch (error) {
            console.error(error)
        }
        setApprovalLoading(false);
    }

    const mint = async () => {
        const inputDittoToMintWith = ethers.utils.parseUnits(inputDitto, 9);
        console.log(inputDittoToMintWith, inputDitto)
        setMintLoading(true);
        try {
            const mintTx = await xDittoContract.mint(account, inputDittoToMintWith);
            await mintTx.wait();
            setModalOpen(true);
        } catch (error) {
            console.error(error);
            if (error.message.includes('MetaMask Tx Signature: User denied transaction signature.'))
                showError('Transaction cancelled.');
        }
        setMintLoading(false);
    }

    if (account === undefined || account === null) {
        return (
            <Box className={classes.buttonContainer} >
                <Button type="button">Connect wallet to BSC mainnet to continue</Button>
            </Box>
        );
    }

    if (!(parseFloat(inputDitto) > 0) || inputDitto === undefined || inputDitto === '') {
        return (
            <Box className={classes.buttonContainer} >
                <Button type="button">Enter an amount</Button>
            </Box>
        )
    }

    if (approvalLoading) {
        return (
            <Button type="button" variant="contained" color="primary" size="large"> <CircularProgress color="white" />Approval loading</Button >
        )
    }

    if (parseInt(dittoAllowanceAmount) === 0) {
        return (
            <Button type="button" variant="contained" color="primary" size="large" onClick={() => {
                approveMint();
            }}> Approve Mint</Button >
        )
    }

    if (mintLoading) {
        return (
            <Button type="button" variant="contained" color="primary" size="large" > <CircularProgress color="#ffffff" /> Minting</Button >
        )
    }

    return (
        <Box className={classes.buttonContainer} >
            <div>
                <Button type="button" variant="contained" color="primary" size="large" onClick={() => {
                    mint();
                }}> Mint</Button>
            </div>
            {errorMessage && <Typography>{errorMessage}</Typography>}
            <SimpleModal open={modalOpen} setModalOpen={setModalOpen} heading={'test'} bodyText={'test'} />
        </Box>
    );
};
