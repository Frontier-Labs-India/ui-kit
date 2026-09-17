<script lang="ts">
  import Tabs, { type Tab } from '../../src/components/Tabs.svelte'
  import TabPanel from '../../src/components/TabPanel.svelte'
  import TabList from '../../src/components/TabList.svelte'
  import TabTrigger from '../../src/components/TabTrigger.svelte'
  import TabContent from '../../src/components/TabContent.svelte'

  let { composed = false, tabs, activeTab, onChange, onClose, lazy = false, showB = true, orientation = 'horizontal' }: {
    composed?: boolean; tabs?: Tab[]; activeTab?: string; onChange?: (id: string) => void; onClose?: (id: string) => void
    lazy?: boolean; showB?: boolean; orientation?: 'horizontal' | 'vertical'
  } = $props()
</script>

{#if composed}
  <Tabs defaultValue="one" {onChange} {orientation}>
    <TabList>
      <TabTrigger value="one">One</TabTrigger>
      <TabTrigger value="two" disabled>Two</TabTrigger>
      <TabTrigger value="three">Three</TabTrigger>
    </TabList>
    <TabContent value="one">First</TabContent>
    <TabContent value="three">Third</TabContent>
  </Tabs>
{:else}
  <Tabs {tabs} {activeTab} {onChange} {onClose} {lazy} {orientation}>
    <TabPanel tabId="a">Panel A</TabPanel>
    {#if showB}<TabPanel tabId="b">Panel B</TabPanel>{/if}
    <TabPanel tabId="c">Panel C</TabPanel>
  </Tabs>
{/if}
