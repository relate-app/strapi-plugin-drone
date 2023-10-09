import React, { useState, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';
import sortBy from 'lodash/sortBy';
import styled from 'styled-components';
import { Box } from '@strapi/design-system/Box';
import { Tab, TabGroup, TabPanel, TabPanels, Tabs } from '@strapi/design-system/Tabs';
import { useIntl } from 'react-intl';
import { useNotification } from '@strapi/helper-plugin';
import { useMutation, useQueryClient } from 'react-query';
import axiosInstance from '../../utils/axiosInstance';
import getTrad from '../../utils/getTrad';
import pluginId from '../../pluginId';
import ContentTypes from '../ContentTypes';
import TAB_LABELS from './utils/tabLabels';

const StyledBox = styled(Box)`
  overflow-x: auto;
`;

const sortContentTypes = contentTypes => sortBy(contentTypes, ct => ct.info.singularName);

const SettingsList = forwardRef(({ contentTypes, initialData }, ref) => {
  const { formatMessage } = useIntl();
  const toggleNotification = useNotification();
  const queryClient = useQueryClient();
  const [modifiedData, setModifiedData] = useState(initialData.contentTypes);
  const [settings] = useState({});

  // Because of the tabs and since we only display the save button when the
  // settings tab is activated we need this trick to retrieve the urls.
  // Plus it avoids having to synchronize the state with the useQueries hook
  useImperativeHandle(ref, () => ({
    getSettings: () => {
      return settings;
    },
  }));

  const mutation = useMutation(
    body => {
      return axiosInstance.put(`/${pluginId}/content-types`, body);
    },
    {
      // Opitmistic response
      onMutate: async body => {
        await queryClient.cancelQueries(`${pluginId}-settings`);

        const previousResponse = queryClient.getQueryData(`${pluginId}-settings`);

        queryClient.setQueryData(`${pluginId}-settings`, old => ({ ...old, contentTypes: body }));

        return { previousResponse };
      },
      onSuccess: () => {
        toggleNotification({
          type: 'success',
          message: {
            id: getTrad('Settings.save-sucess'),
            defaultMessage: 'Settings have been updated',
          },
        });
      },
    }
  );

  const collectionTypes = sortContentTypes(
    contentTypes.filter(({ kind }) => kind === 'collectionType')
  );
  const singleTypes = sortContentTypes(contentTypes.filter(({ kind }) => kind === 'singleType'));

  const handleChange = (uid, field) => {
    const updatedState = {
      ...modifiedData,
      [uid]: { ...modifiedData[uid], [field]: !modifiedData[uid][field] },
    };
    setModifiedData(updatedState);

    mutation.mutate(updatedState);
  };

  return (
    <Box shadow="filterShadow" hasRadius>
      <TabGroup
        id="tabs"
        label={formatMessage({
          id: 'Settings.link-name',
          defaultMessage: 'Configuration',
        })}
      >
        <Tabs>
          {TAB_LABELS.map(tabLabel => (
            <Tab key={tabLabel.id}>
              {formatMessage({ id: tabLabel.labelId, defaultMessage: tabLabel.defaultMessage })}
            </Tab>
          ))}
        </Tabs>
        <TabPanels style={{ position: 'relative' }}>
          <TabPanel>
            <StyledBox background="neutral0">
              <ContentTypes
                contentTypes={collectionTypes}
                modifiedData={modifiedData}
                onChange={handleChange}
              />
            </StyledBox>
          </TabPanel>
          <TabPanel>
            <StyledBox background="neutral0">
              <ContentTypes
                contentTypes={singleTypes}
                modifiedData={modifiedData}
                onChange={handleChange}
              />
            </StyledBox>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Box>
  );
});

SettingsList.displayName = 'SettingsList';

SettingsList.propTypes = {
  contentTypes: PropTypes.array.isRequired,
  initialData: PropTypes.shape({
    contentTypes: PropTypes.object.isRequired,
  }).isRequired,
};

export default SettingsList;
