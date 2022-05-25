import detectEthereumProvider from "@metamask/detect-provider"
import { Strategy, ZkIdentity } from "@zk-kit/identity"
import { generateMerkleProof, Semaphore } from "@zk-kit/protocols"
import { Contract, providers, utils } from "ethers"
import Head from "next/head"
import React from "react"
import { Button, Card, CardContent, TextField, Typography } from '@mui/material'
import { useFormik } from 'formik'
import * as yup from 'yup'
import Greeter from "artifacts/contracts/Greeters.sol/Greeters.json"
import styles from "../styles/Home.module.css"

export default function Home() {
    const [logs, setLogs] = React.useState("Connect your wallet and greet!")
    const [greeting, setGreeting] = React.useState("")

    async function greet() {
        setLogs("Creating your Semaphore identity...")

        const provider = (await detectEthereumProvider()) as any

        await provider.request({ method: "eth_requestAccounts" })

        const ethersProvider = new providers.Web3Provider(provider)
        const signer = ethersProvider.getSigner()
        const message = await signer.signMessage("Sign this message to create your identity!")

        const identity = new ZkIdentity(Strategy.MESSAGE, message)
        const identityCommitment = identity.genIdentityCommitment()
        const identityCommitments = await (await fetch("./identityCommitments.json")).json()

        const merkleProof = generateMerkleProof(20, BigInt(0), identityCommitments, identityCommitment)

        setLogs("Creating your Semaphore proof...")

        const greeting = "Hello world"

        const witness = Semaphore.genWitness(
            identity.getTrapdoor(),
            identity.getNullifier(),
            merkleProof,
            merkleProof.root,
            greeting
        )

        const { proof, publicSignals } = await Semaphore.genProof(witness, "./semaphore.wasm", "./semaphore_final.zkey")
        const solidityProof = Semaphore.packToSolidityProof(proof)

        const response = await fetch("/api/greet", {
            method: "POST",
            body: JSON.stringify({
                greeting,
                nullifierHash: publicSignals.nullifierHash,
                solidityProof: solidityProof
            })
        })

        if (response.status === 500) {
            const errorMessage = await response.text()

            setLogs(errorMessage)
        } else {
            setLogs("Your anonymous greeting is onchain :)")
        }
    }

    const listenGreeting = async () => {
        try {
            const contract = new Contract("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", Greeter.abi)
            const provider = new providers.JsonRpcProvider("http://localhost:8545")
            const greeterContract = contract.connect(provider.getSigner())

            // Call initializing methods after wallet is signed in
            greeterContract.on('NewGreeting', (greeting: string) => {
                setGreeting(utils.parseBytes32String(greeting))
            })
        } catch (error) {
          console.log(error)
        }
    }

    React.useEffect(() => { listenGreeting() }, []);

    const validationSchema = yup.object({
        name: yup
            .string()
            .required('Name is required'),
        age: yup
            .number()
            .positive('Age must be positive')
            .required('Age is required'),
        address: yup
            .string()
            .required('Address is required')
    });

    const GreetingMessage = () => (
        <Card className={styles.card}>
            <CardContent>
                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                    Greeting Event
                </Typography>
                {greeting}
            </CardContent>
        </Card>
    );

    const InputMaterialUI = () => {
        const formik = useFormik({
            initialValues: {
                name: '',
                age: '',
                address: '',
            },
            validationSchema,
            onSubmit: ({ name, age, address }) => {
                const input = { name, age, address };
                // Display the input entries to the console in JSON format
                console.log(input);
            }
        });

        return (
            <Card className={styles.card}>
                <CardContent>
                    <form className={styles.form} onSubmit={formik.handleSubmit}>
                        <TextField
                            fullWidth
                            id="name"
                            name="name"
                            label="Name"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            error={formik.touched.name && Boolean(formik.errors.name)}
                            helperText={formik.touched.name && formik.errors.name}
                        />
                        <TextField
                            fullWidth
                            id="age"
                            name="age"
                            label="Age"
                            type="number"
                            value={formik.values.age}
                            onChange={formik.handleChange}
                            error={formik.touched.age && Boolean(formik.errors.age)}
                            helperText={formik.touched.age && formik.errors.age}
                        />
                        <TextField
                            fullWidth
                            id="address"
                            name="address"
                            label="Address"
                            value={formik.values.address}
                            onChange={formik.handleChange}
                            error={formik.touched.address && Boolean(formik.errors.address)}
                            helperText={formik.touched.address && formik.errors.address}
                        />
                        <Button fullWidth variant="contained" type="submit">Submit</Button>
                    </form>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className={styles.container}>
            <Head>
                <title>Greetings</title>
                <meta name="description" content="A simple Next.js/Hardhat privacy application with Semaphore." />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>Greetings</h1>

                <p className={styles.description}>A simple Next.js/Hardhat privacy application with Semaphore.</p>

                <div className={styles.logs}>{logs}</div>

                <div onClick={() => greet()} className={styles.button}>
                    Greet
                </div>

                <GreetingMessage />

                <InputMaterialUI />
            </main>
        </div>
    )
}
