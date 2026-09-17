<script lang="ts">
  import Tabs from '../../src/components/Tabs.svelte'
  import TabPanel from '../../src/components/TabPanel.svelte'
</script>

<Tabs tabs={[{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }]} defaultTab="b">
  <TabPanel tabId="a">Panel A</TabPanel>
  <TabPanel tabId="b">Panel B</TabPanel>
</Tabs>
