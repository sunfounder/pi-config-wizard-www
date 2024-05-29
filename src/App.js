import * as React from 'react';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Slide,
  Snackbar,
  Switch,
  Toolbar,
  Typography,
} from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

import Editor from '@monaco-editor/react';

const API_PREFIX = "/api/v1/";
const url = '.'

function App() {
  const [page, setPage] = React.useState('menu');
  const [snackBarMessage, setSnackBarMessage] = React.useState('');
  const [snackBarOpen, setSnackBarOpen] = React.useState(false);
  const [snackBarSeverity, setSnackBarSeverity] = React.useState('success');
  const [configTxt, setConfigTxt] = React.useState('');

  const request = async (method, endpoint, data) => {
    let payload = {
      method: method,
    }
    if (method === 'POST') {
      payload.headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      };
      payload.body = JSON.stringify(data);
    }
    let response = await fetch(url + API_PREFIX + endpoint, payload);
    let result = await response.json();
    return result;
  };

  const showEditConfigTxt = async () => {
    await updateConfigTxt();
    setPage('editConfigTxt');
  }

  const handleSnackBarClose = () => {
    setSnackBarOpen(false);
  }

  const showSnackBar = (severity, message) => {
    setSnackBarSeverity(severity);
    setSnackBarMessage(message);
    setSnackBarOpen(true);
  }

  const updateConfigTxt = async () => {
    let response = await request("GET", "configTxt");
    if ('error' in response) {
      showSnackBar("error", "Error: " + response.error);
      return;
    }
    setConfigTxt(response.configTxt);
  }

  const handleConfigTxtChange = (value) => {
    setConfigTxt(value);
  }

  const handleSave = async () => {
    let response = await request("POST", "configTxt", {
      configTxt: configTxt,
    });
    if ('error' in response) {
      showSnackBar("error", "Error: " + response.error);
      return;
    }
    showSnackBar("success", "config.txt saved");
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      justifyContent: 'center',
      width: '100%',
      height: '100%',
    }}>
      <AppBar position="static">
        <Toolbar>
          {page === 'editConfigTxt' &&
            <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => setPage('menu')}>
              <ArrowBackIosIcon />
            </IconButton>}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {page === 'menu' && "Raspberry Pi Configurator"}
            {page === 'editConfigTxt' && "Edit config.txt"}
          </Typography>
          {page === 'editConfigTxt' && <Button color="inherit" onClick={handleSave}>Save</Button>}
        </Toolbar>
      </AppBar>
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {page === 'menu' && <Menu request={request} onEditConfigTxt={showEditConfigTxt} showSnackBar={showSnackBar} />}
        {page === 'editConfigTxt' && <EditConfigTxt configTxt={configTxt} onChange={handleConfigTxtChange} />}
      </Box>
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={handleSnackBarClose}
        TransitionComponent={Slide}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snackBarSeverity}>
          {snackBarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function Menu(props) {
  const [mounted, setMounted] = React.useState(false);
  const [i2cState, setI2CState] = React.useState(false);
  const [spiState, setSPIState] = React.useState(false);
  const [mountLoading, setMountLoading] = React.useState(false);
  const [i2cLoading, setI2CLoading] = React.useState(false);
  const [spiLoading, setSPILoading] = React.useState(false);

  const updateI2CState = async () => {
    setI2CLoading(true);
    let response = await props.request("GET", "i2c");
    setI2CLoading(false);
    if ('error' in response) {
      props.showSnackBar("error", "Error: " + response.error);
      return;
    }
    setI2CState(response.enable);
  }

  const updateSPIState = async () => {
    setSPILoading(true);
    let response = await props.request("GET", "spi");
    setSPILoading(false);
    if ('error' in response) {
      props.showSnackBar("error", "Error: " + response.error);
      return;
    }
    setSPIState(response.enable);
  }

  const handleMount = async () => {
    setMountLoading(true);
    let response = await props.request("POST", "mount");
    if ('error' in response) {
      if (response.error === "PERMISSION_DENIED")
        alert("Permission denied. Please disable protection mode in the settings. And restart the addon");
      else
        alert("Error: " + response.error);
      return;
    }
    setMounted(!mounted);
    props.showSnackBar("success", "Boot partition mounted");
    updateI2CState();
    updateSPIState();
  }

  const handleI2CChanged = async (e) => {
    let checked = e.target.checked;
    setI2CLoading(true);
    let response = await props.request("POST", "i2c", { enable: checked });
    setI2CLoading(false);
    if ('error' in response) {
      props.showSnackBar("error", "Error: " + response.error);
      return;
    }
    setI2CState(checked);
    props.showSnackBar("success", `I2C interfaces ${checked ? "enabled" : "disabled"}. First time enabling I2C need twice reboot to take effect`);
  }

  const handleSPIChanged = async (e) => {
    let checked = e.target.checked;
    setSPILoading(true);
    let response = await props.request("POST", "spi", { enable: checked });
    setSPILoading(false);
    if ('error' in response) {
      props.showSnackBar("error", "Error: " + response.error);
      return;
    }
    setSPIState(checked);
    props.showSnackBar("success", `SPI interfaces ${checked ? "enabled" : "disabled"}. Reboot to take effect`);
  }

  const handleReboot = async () => {
    if (window.confirm("Are you sure you want to reboot the Raspberry Pi?")) {
      props.request("POST", "reboot");
      props.showSnackBar("success", "Rebooting...");
    }
  }

  const updateMounted = async () => {
    let response = await props.request("GET", "mounted");
    if ('error' in response) {
      props.showSnackBar("error", "Error: " + response.error);
      return;
    }
    setMounted(response.mounted);
    if (response.mounted) {
      updateI2CState();
      updateSPIState();
    }
  }

  React.useEffect(() => {
    updateMounted();
  }, []);

  return (
    <Box width={500}>
      <Card elevation={10}>
        <CardContent>
          <List>
            {mounted ?
              <>
                <ListItem>
                  <ListItemText primary="I2C" secondary="Enable I2C interfaces, First time enabling need reboot twice to take effect" />
                  {i2cLoading && <CircularProgress size={24} />}
                  <Switch checked={i2cState} disabled={i2cLoading} onChange={handleI2CChanged} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="SPI" secondary="Enable SPI interfaces" />
                  {spiLoading && <CircularProgress size={24} />}
                  <Switch checked={spiState} disabled={spiLoading} onChange={handleSPIChanged} />
                </ListItem>
                <ListItemButton onClick={props.onEditConfigTxt}>
                  <ListItemText primary="Edit config.txt" secondary="Edit the config.txt file" />
                </ListItemButton>
              </> :
              <ListItem>
                <ListItemText primary="Boot partition" secondary="Mount the boot partition before any configuration" />
                {mountLoading && <CircularProgress size={24} />}
                <Button disabled={mounted || mountLoading} onClick={handleMount}>{mounted ? "Unmount" : "Mount"}</Button>
              </ListItem>
            }
            <ListItemButton onClick={handleReboot}>
              <ListItemText primary="Reboot" secondary="Reboot the Raspberry Pi" />
            </ListItemButton>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}

function EditConfigTxt(props) {

  return (
    <Editor defaultLanguage="ini" value={props.configTxt} onChange={props.onChange} />
  );
}

export default App;
