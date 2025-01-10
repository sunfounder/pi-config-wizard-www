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
  const [mounted, setMounted] = React.useState(false);
  const [i2cEnabled, setI2CEnabled] = React.useState(null);
  const [i2cConfigured, setI2CConfigured] = React.useState(false);
  const [spiEnabled, setSPIEnabled] = React.useState(null);
  const [spiConfigured, setSPIConfigured] = React.useState(false);
  const [configTxtChanged, setConfigTxtChanged] = React.useState(false);

  const request = React.useCallback(async (method, endpoint, data) => {
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
  }, []);

  const showSnackBar = React.useCallback((severity, message) => {
    setSnackBarSeverity(severity);
    setSnackBarMessage(message);
    setSnackBarOpen(true);
  }, []);

  const showEditConfigTxt = async () => {
    await updateConfigTxt();
    setPage('editConfigTxt');
  }

  const updateConfigTxt = React.useCallback(async () => {
    let response = await request("GET", "configTxt");
    if ('error' in response) {
      showSnackBar("error", "Error: " + response.error);
      return;
    }
    setConfigTxt(response.configTxt);
  }, [request, showSnackBar]);

  const handleSnackBarClose = () => {
    setSnackBarOpen(false);
  }

  const updateMounted = React.useCallback(async () => {
    let response = await request("GET", "mounted");
    if ('error' in response) {
      showSnackBar("error", "Error: " + response.error);
      return;
    }
    setMounted(response.is_mounted);
    if (response.is_mounted === true) {
      handleMount();
    }
  }, [request, showSnackBar, updateConfigTxt]);

  const updateI2CState = React.useCallback(async () => {
    let response = await request("GET", "i2c");
    console.log("i2c", response);
    if ('error' in response) {
      showSnackBar("error", "Error: " + response.error);
      return;
    }
    setI2CEnabled(response.enabled);
    setI2CConfigured(response.configured);
  }, [request, showSnackBar]);

  const updateSPIState = React.useCallback(async () => {
    let response = await request("GET", "spi");
    console.log("spi", response);
    if ('error' in response) {
      showSnackBar("error", "Error: " + response.error);
      return;
    }
    setSPIEnabled(response.enabled);
    setSPIConfigured(response.configured);
  }, [request, showSnackBar]);

  const handleMount = async () => {
    setMounted(true);
    await updateConfigTxt();
    await updateI2CState();
    await updateSPIState();
  }

  const init = React.useCallback(async () => {
    await updateMounted();
  }, [updateMounted]);

  const handleConfigTxtChange = (value) => {
    setConfigTxtChanged(true);
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

  React.useEffect(() => {
    init();
  }, [init]);

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
        {page === 'menu' && <Menu
          request={request}
          onEditConfigTxt={showEditConfigTxt}
          showSnackBar={showSnackBar}
          i2cEnabled={i2cEnabled}
          i2cConfigured={i2cConfigured}
          spiEnabled={spiEnabled}
          spiConfigured={spiConfigured}
          configTxtChanged={configTxtChanged}
          mounted={mounted}
          onMountChange={handleMount}
          onI2CConfiguredChange={setI2CConfigured}
          onSPIConfiguredChange={setSPIConfigured}
        />}
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
  const [mountLoading, setMountLoading] = React.useState(false);
  const [i2cLoading, setI2CLoading] = React.useState(false);
  const [spiLoading, setSPILoading] = React.useState(false);

  const {
    i2cEnabled,
    i2cConfigured,
    spiEnabled,
    spiConfigured,
    mounted,
    request,
    showSnackBar,
    onEditConfigTxt,
    onMountChange,
    onI2CConfiguredChange,
    onSPIConfiguredChange,
    configTxtChanged,
  } = props;

  const handleMount = async () => {
    setMountLoading(true);
    let response = await request("POST", "mount");
    setMountLoading(false);
    if ('error' in response) {
      if (response.error === "PERMISSION_DENIED")
        alert("Permission denied. Please disable protection mode in the settings. And restart the addon");
      else
        alert("Error: " + response.error);
      return;
    }
    showSnackBar("success", "Boot partition mounted");
    onMountChange(true);
  }

  const handleI2CChanged = async (e) => {
    let checked = e.target.checked;
    setI2CLoading(true);
    let response = await request("POST", "i2c", { enable: checked });
    setI2CLoading(false);
    if ('error' in response) {
      showSnackBar("error", "Error: " + response.error);
      return;
    }
    onI2CConfiguredChange(checked);
    showSnackBar("success", `I2C interfaces ${checked ? "enabled" : "disabled"}. Reboot to take effect`);
  }

  const handleSPIChanged = async (e) => {
    let checked = e.target.checked;
    setSPILoading(true);
    let response = await request("POST", "spi", { enable: checked });
    setSPILoading(false);
    if ('error' in response) {
      showSnackBar("error", "Error: " + response.error);
      return;
    }
    onSPIConfiguredChange(checked);
    showSnackBar("success", `SPI interfaces ${checked ? "enabled" : "disabled"}. Reboot to take effect`);
  }

  const handleReboot = async () => {
    if (window.confirm("Are you sure you want to reboot the Raspberry Pi?")) {
      request("POST", "reboot");
      showSnackBar("success", "Rebooting...");
    }
  }

  let needReboot = false;
  let i2cHint = "Enable I2C interfaces";
  if (i2cConfigured === true && i2cEnabled === false) {
    i2cHint = <ErrorSecondery text="Configured on, but not yet enabled. Try rebooting." />;
    needReboot = true;
  } else if (i2cConfigured === false && i2cEnabled === true) {
    i2cHint = <ErrorSecondery text="Configured off, but still enable. Try rebooting." />;
    needReboot = true;
  }
  let spiHint = "Enable SPI interfaces";
  if (spiConfigured === true && spiEnabled === false) {
    spiHint = <ErrorSecondery text="Configured on, but not yet enabled. Try rebooting." />;
    needReboot = true;
  } else if (spiConfigured === false && spiEnabled === true) {
    spiHint = <ErrorSecondery text="Configured off, but still enable. Try rebooting." />;
    needReboot = true;
  }
  let configTxtHint = "Edit the config.txt file";
  if (configTxtChanged) {
    configTxtHint = <ErrorSecondery text="Unsaved changes, save before editing" />;
    needReboot = true;
  }
  let rebootHint = "Reboot the Raspberry Pi";
  if (needReboot) {
    rebootHint = <ErrorSecondery text="Reboot to apply changes" />;
  }

  return (
    <Box width={500}>
      <Card elevation={10}>
        <CardContent>
          <List>
            {mounted ?
              <>
                <ListItem>
                  <ListItemText primary="I2C" secondary={i2cHint} />
                  {i2cLoading && <CircularProgress size={24} />}
                  <Switch checked={i2cConfigured} disabled={i2cLoading} onChange={handleI2CChanged} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="SPI" secondary={spiHint} />
                  {spiLoading && <CircularProgress size={24} />}
                  <Switch checked={spiConfigured} disabled={spiLoading} onChange={handleSPIChanged} />
                </ListItem>
                <ListItemButton onClick={onEditConfigTxt}>
                  <ListItemText primary="Edit config.txt" secondary={configTxtHint} />
                </ListItemButton>
              </> :
              <ListItem>
                <ListItemText primary="Boot partition" secondary="Mount the boot partition before any configuration" />
                {mountLoading && <CircularProgress size={24} />}
                <Button disabled={mounted || mountLoading} onClick={handleMount}>{mounted ? "Unmount" : "Mount"}</Button>
              </ListItem>
            }
            <ListItemButton onClick={handleReboot}>
              <ListItemText primary="Reboot" secondary={rebootHint} />
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

function ErrorSecondery(props) {
  const text = props.text;
  return (
    <Typography color="error" sx={{fontSize: 14}}>{text}</Typography>
  );
}

export default App;
