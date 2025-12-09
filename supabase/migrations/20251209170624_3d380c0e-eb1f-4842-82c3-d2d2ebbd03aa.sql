-- Update map_servers with correct verified URLs
UPDATE map_servers 
SET base_url = 'https://www.gis.hctx.net/arcgishcpid/rest/services/State/PUC_CCN_Sewer_Water/MapServer/1',
    updated_at = now()
WHERE server_key = 'harris_ccn_water';

UPDATE map_servers 
SET base_url = 'https://www.gis.hctx.net/arcgishcpid/rest/services/State/PUC_CCN_Sewer_Water/MapServer/2',
    updated_at = now()
WHERE server_key = 'harris_ccn_sewer';

UPDATE map_servers 
SET base_url = 'https://www.gis.hctx.net/arcgishcpid/rest/services/TXRRC/Pipelines/MapServer/0',
    updated_at = now()
WHERE server_key = 'rrc_pipelines';