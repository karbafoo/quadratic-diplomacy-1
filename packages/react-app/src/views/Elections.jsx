import { SyncOutlined } from "@ant-design/icons";
import { utils } from "ethers";
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Input,
  List,
  Progress,
  Slider,
  Spin,
  Switch,
  Table,
  Modal,
  Form,
  Checkbox,
  Select,
  Space,
} from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Address, Balance } from "../components";

import { useEventListener } from "../hooks";

const { Option } = Select;

export default function Elections({
  address,
  mainnetProvider,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
}) {
  const [numElections, setNumElections] = useState(0);
  const [tableDataSrc, setTableDataSrc] = useState([]);
  const [newElecName, setNewElecName] = useState("");

  const [isModalVisible, setIsModalVisible] = useState(false);

  const [newElecWorkers, setNewElecWorkers] = useState([]);
  const [newElecAddr, setNewElecAddr] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const [form] = Form.useForm();

  const route_history = useHistory();

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  //   , , "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  //   "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
  const worker_mapping = {
    swapp: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    hans: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    bliss: "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
    varun: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
    ryan: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
  };

  function handleAddrSelected(value) {
    // console.log(value);
    const addrs = [];
    value.forEach(v => {
      const addr = worker_mapping[Object.keys(worker_mapping)[v]];
      addrs.push(addr);
    });
    setNewElecAddr(addrs);
  }

  function viewElection() {
    route_history.push("/voting/" + id);
  }

  const electionCreatedEvent = useEventListener(readContracts, "Diplomacy", "ElectionCreated", localProvider, 1);

  const columns = [
    {
      title: "Created date",
      dataIndex: "created_date",
      key: "created_date",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "# Workers",
      dataIndex: "n_workers",
      key: "n_workers",
    },
    {
      title: "# Voted",
      dataIndex: "n_voted",
      key: "n_voted",
    },
    {
      title: "Action",
      key: "action",
      render: () => (
        <Space size="middle">
          <Button type="primary" size="small" onClick={() => viewElection()}>
            View
          </Button>
        </Space>
      ),
    },
  ];
  useEffect(() => {
    if (readContracts) {
      if (readContracts.Diplomacy) {
        init();
      }
    }
  }, [readContracts]);

  useEffect(() => {
    if (readContracts) {
      if (readContracts.Diplomacy) {
        updateView();
        setIsCreating(false);
        setNewElecAddr([]);
        setNewElecName("");
        form.resetFields();
      }
    }
  }, [electionCreatedEvent]);

  const init = async () => {
    console.log("contract loaded ", readContracts.Diplomacy);

    let workers = [];
    for (let i = 0; i < Object.keys(worker_mapping).length; i++) {
      workers.push(<Option key={i}>{Object.keys(worker_mapping)[i]}</Option>);
    }
    setNewElecWorkers(workers);

    updateView();
  };

  const updateView = async () => {
    const numElections = (await readContracts.Diplomacy.numElections()).toNumber();
    console.log("numElections ", numElections);
    setNumElections(numElections);
    let data = [];
    for (let i = 0; i < numElections; i++) {
      const election = await readContracts.Diplomacy.getElectionById(i);
      const name = election.name;
      const n_addr = election.n_addr.toNumber();
      data.push({ key: i, created_date: "8/16/2021", name: name, n_workers: n_addr, n_voted: 0 });
    }
    setTableDataSrc(data);
  };

  const createNewElection = () => {
    console.log("createNewElection");
    setIsModalVisible(true);
  };

  const onFinish = async () => {
    setIsCreating(true);
    const result = tx(writeContracts.Diplomacy.newElection(newElecName, newElecAddr), update => {
      console.log("📡 Transaction Update:", update);
      if (update && (update.status === "confirmed" || update.status === 1)) {
        console.log(" 🍾 Transaction " + update.hash + " finished!");
        // console.log(
        //   " ⛽️ " +
        //     update.gasUsed +
        //     "/" +
        //     (update.gasLimit || update.gas) +
        //     " @ " +
        //     parseFloat(update.gasPrice) / 1000000000 +
        //     " gwei",
        // );
      }
    });
    console.log("awaiting metamask/web3 confirm result...", result);
    console.log(await result);
  };

  return (
    <>
      <Modal title="Election Info" visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <Form
          form={form}
          name="normal_login"
          className="login-form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please input election name!" }]}>
            <Input
              placeholder="Election Name"
              onChange={e => {
                setNewElecName(e.target.value);
              }}
            />
          </Form.Item>
          <Form.Item label="Select" name="addr">
            <Select
              mode="multiple"
              allowClear
              style={{ width: "100%" }}
              placeholder="Please select"
              onChange={handleAddrSelected}
            >
              {newElecWorkers}
            </Select>
          </Form.Item>
          <Form.Item>
            {!isCreating && (
              <Button type="primary" htmlType="submit" className="login-form-button">
                Create new
              </Button>
            )}
            {isCreating && (
              <Button type="primary" size="small" loading>
                Creating
              </Button>
            )}
          </Form.Item>
        </Form>
      </Modal>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <h2>Elections</h2>
        <div>Number of elections: {numElections}</div>
        <Divider />
        <Button style={{ margin: 4 }} onClick={() => createNewElection()}>
          Create New Election
        </Button>
        <Table dataSource={tableDataSrc} columns={columns} />
      </div>
    </>
  );
}
