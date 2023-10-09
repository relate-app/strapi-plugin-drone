import * as yup from 'yup';

const schema = yup.object().shape({
  enabled: yup.boolean(),
});

export default schema;
