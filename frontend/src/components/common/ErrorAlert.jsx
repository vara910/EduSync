import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';

const ErrorAlert = ({ message }) => {
  return (
    <Alert variant="danger" className="my-3">
      <Alert.Heading>Error</Alert.Heading>
      <p>{message}</p>
    </Alert>
  );
};

ErrorAlert.propTypes = {
  message: PropTypes.string.isRequired
};

export default ErrorAlert;

