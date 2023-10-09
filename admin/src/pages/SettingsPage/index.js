import React, { useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Main } from '@strapi/design-system/Main';
import { Switch } from '@strapi/design-system/Switch';
import { ContentLayout, HeaderLayout } from '@strapi/design-system/Layout';
import { EmptyStateLayout } from '@strapi/design-system/EmptyStateLayout';
import { useFocusWhenNavigate, LoadingIndicatorPage, useNotification } from '@strapi/helper-plugin';
import EmptyDocuments from '@strapi/icons/EmptyDocuments';
import { useQueries, useMutation, useQueryClient } from 'react-query';
import pluginId from '../../pluginId';
import getTrad from '../../utils/getTrad';
import SettingsList from '../../components/SettingsList';
import { fetchContentTypes, fetchSettings, putSettings } from './utils/api';

const SettingsPage = () => {
  const { formatMessage } = useIntl();
  const [
    { data: contentTypes, isLoading },
    { data: settingsData, isLoading: isLoadingForSettings },
  ] = useQueries([
    { queryKey: `${pluginId}-content-types`, queryFn: fetchContentTypes },
    {
      queryKey: `${pluginId}-settings`,
      queryFn: fetchSettings,
    },
  ]);
  const toggleNotification = useNotification();
  const [formErrors] = useState({});
  const ref = useRef();
  const queryClient = useQueryClient();

  useFocusWhenNavigate();

  const mutation = useMutation(putSettings, {
    onMutate: async settings => {
      await queryClient.cancelQueries(`${pluginId}-settings`);

      const previousResponse = queryClient.getQueryData(`${pluginId}-settings`);

      queryClient.setQueryData(`${pluginId}-settings`, old => ({
        ...old,
        settings,
      }));

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
  });

  const onToggleEnabled = () => {
    mutation.mutate({ enabled: !settingsData?.settings?.enabled });
  };

  const shouldShowLoader = isLoading || isLoadingForSettings;

  if (shouldShowLoader) {
    return (
      <Main aria-busy="true">
        <LoadingIndicatorPage />
      </Main>
    );
  }

  const primaryAction = (
    <Switch
      onLabel={formatMessage({
        id: 'Settings.build.enabled',
        defaultMessage: 'Enabled',
      })}
      offLabel={formatMessage({
        id: 'Settings.build.disabled',
        defaultMessage: 'Disabled',
      })}
      label={formatMessage({
        id: getTrad('Settings.table.th-status'),
        defaultMessage: 'Status',
      })}
      selected={settingsData?.settings?.enabled}
      onChange={() => {
        onToggleEnabled();
      }}
      visibleLabels
    />
  );

  return (
    <Main tabIndex={-1}>
      <HeaderLayout
        primaryAction={primaryAction}
        title={formatMessage({ id: getTrad('Settings.title'), defaultMessage: 'Drone' })}
        subtitle={formatMessage({
          id: getTrad('Settings.description'),
          defaultMessage: 'Trigger builds in Drone CI',
        })}
      />
      <ContentLayout>
        {contentTypes.length === 0 ? (
          <EmptyStateLayout
            icon={<EmptyDocuments width={undefined} height={undefined} />}
            content={formatMessage({
              id: getTrad('Settings.list-empty'),
              defaultMessage:
                "You don't have any content yet, we recommend you to create your first Content-Type.",
            })}
          />
        ) : (
          <SettingsList
            ref={ref}
            contentTypes={contentTypes}
            formErrors={formErrors}
            initialData={settingsData}
          />
        )}
      </ContentLayout>
    </Main>
  );
};

export default SettingsPage;
