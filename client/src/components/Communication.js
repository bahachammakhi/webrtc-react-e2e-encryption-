import React from "react";
import { makeStyles } from "@material-ui/core/styles";
const useStyles = makeStyles(() => ({
  root: {
    backgroundColor: "#243241",
    position: "absolute",
    bottom: 0,
    height: "100px",
    width: "100%",
    zIndex: 1000,
  },
}));

const Communication = (props) => {
  const classes = useStyles();
  return <div className={classes.root}></div>;
};

export default Communication;
