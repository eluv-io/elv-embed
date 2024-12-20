import "./static/stylesheets/form.scss";
import "@mantine/core/styles.css";

const DEFAULT_CONTENT = "hq__CcdV4wnCNq9wv6jXpYeCQ2GE4FLQBFtVSSSt2XKfBJMrH89DFDGsfkpWWvBy16QBGGYeF5mLGo";
const DEFAULT_FRAME_WIDTH = Math.min(window.innerWidth * 0.8, 854);

import React, {useEffect, useRef, useState} from "react";
import {
  Checkbox,
  Container,
  Group,
  MantineProvider,
  Paper,
  Button,
  Title,
  Select,
  Stack,
  Anchor,
  TextInput,
  NumberInput,
  JsonInput,
  Code,
  Accordion,
  Textarea
} from "@mantine/core";
import {createRoot} from "react-dom/client";
import {mediaTypes, LoadParams, GenerateEmbedURL} from "./Utils";

import Logo from "./static/images/Logo.png";
import {Utils} from "@eluvio/elv-client-js";
import {useForm} from "@mantine/form";
import {EluvioPlayerParameters} from "@eluvio/elv-player-js/lib/index";

let initialParams = LoadParams({playerParams: false});
initialParams.autoplay = initialParams.scrollPlayPause ? "Only When Visible" : initialParams.autoplay ? "On" : "Off";

const ScrollTo = (top) => {
  // Mobile has a bug that prevents scroll top from working
  if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    document.querySelector("#app").scrollTo(0, top);
  } else {
    document.querySelector("#app").scrollTo({top, behavior: "smooth"});
  }
};

const EmbedFrame = ({dimensions, embedUrl}) => {
  const ref = useRef();
  useEffect(() => {
    if(!ref.current) { return; }

    setTimeout(() => ScrollTo(ref.current.offsetTop), 200);
  }, [ref]);

  const embedFrameString =
`<iframe
  width=${dimensions.width} height=${dimensions.height} scrolling="no" marginheight="0"
  marginwidth="0" frameborder="0" type="text/html" allowtransparency="true"
  src="${embedUrl}"
></iframe>`;

  return (
    <Container size={dimensions.width + 100} my="xl" ref={ref}>
      <Paper withBorder p="xl">
        <Title order={4} fw={500} mb="xs">Embed Url</Title>
        <Anchor style={{wordWrap: "anywhere"}} fz="sm" href={embedUrl.toString()} target="_blank">{ embedUrl.toString() }</Anchor>

        <Title order={4} fw={500} mt="xl" mb="xs">Embed Code</Title>
        <Code block>{embedFrameString}</Code>


        <Title order={4} fw={500} mt="xl" mb="xs">Preview</Title>
        <div dangerouslySetInnerHTML={{__html: embedFrameString}} />
      </Paper>
    </Container>
  );
};

const Form = () => {
  const [embedUrl, setEmbedUrl] = useState(undefined);
  const [dimensions, setDimensions] = useState({
    width: DEFAULT_FRAME_WIDTH,
    height: Math.floor(DEFAULT_FRAME_WIDTH * 9 / 16)
  });
  let initialValues = {
    title: "",
    description: "",
    image: "",
    posterImage: "",
    headerText: "",
    network: "main",
    contentId: "",
    collectionId: "",
    offerings: "",
    mediaType: "v",
    mediaUrlParameters: "{}",
    playerProfile: "",
    authorizationToken: "",
    promptTicket: false,
    tenantId: "",
    ntpId: "",
    ticketCode: "",
    ticketSubject: "",
    linkPath: "",
    directLink: false,
    ui: "",
    autoplay: "Off",
    controls: "h",
    loop: false,
    muted: false,
    verifyContent: false,
    hideWatermark: false,
    hideTitle: false,
    capLevelToPlayerSize: false,
    embedCode: "",
    clipStart: "",
    clipEnd: "",
    maxBitrate: "",
    hlsOptions: "{}",
    dvr: false,
    ...initialParams
  };

  // Convert versionHash and/or objectId to contentId
  if(!initialValues.contentId) {
    initialValues.contentId = initialValues.versionHash || initialValues.objectId;
  }

  delete initialValues.versionHash;
  delete initialValues.objectId;

  // If no content ID specified, use default
  if(!initialValues.contentId) {
    initialValues.contentId = DEFAULT_CONTENT;
  }

  const form = useForm({
    initialValues,
    validate: {
      contentId: value => {
        if(value.startsWith("iq__")) {
          if(!Utils.ValidAddress(Utils.HashToAddress(value))) {
            return "Invalid Object ID";
          }
        } else if(value.startsWith("hq__")) {
          try {
            if(!Utils.ValidAddress(Utils.HashToAddress(Utils.DecodeVersionHash(value).objectId))) {
              return "Invalid Version Hash";
            }
          } catch(error) {
            return "Invalid version hash";
          }
        } else {
          return "Invalid Content ID";
        }
      },
      hlsOptions: value => {
        try {
          value && JSON.parse(value);
        } catch(error) {
          return "Invalid JSON: " + error.toString();
        }
      },
      mediaUrlParameters: value => {
        try {
          value && JSON.parse(value);
        } catch(error) {
          return "Invalid JSON: " + error.toString();
        }
      }
    }
  });

  useEffect(() => {
    setEmbedUrl(undefined);
  }, [form.values, dimensions]);

  return (
    <MantineProvider>
      <Container fluid size="100%" mx={0} p="sm">
        <Group>
          <img src={Logo} alt="Eluvio" style={{height: "25px"}} />
        </Group>
      </Container>
      <Container w="100%" py="xl" pb={50}>
        <Paper withBorder p="xl" maw={800} mx="auto" shadow="sm">
          <form
            onSubmit={form.onSubmit(
              values => {
                setEmbedUrl(GenerateEmbedURL({values}));
              },
              () => ScrollTo(0)
            )}
          >
            <Title fw={500} order={3} mb="xl" ta="center">Create an Eluvio Embed URL</Title>

            <Stack gap="xs">
              <Title fw={500} order={4}>Content</Title>
              <Select
                required
                label="Network"
                data={[{label: "Main", value: "main"}, {label: "Demo", value: "demo"}]}
                {...form.getInputProps("network")}
              />
              <Select
                required
                label="Media Type"
                data={Object.keys(mediaTypes).map(key => ({label: mediaTypes[key], value: key}))}
                {...form.getInputProps("mediaType")}
              />
              <TextInput
                required
                label={form.values.mediaType === "mc" ? "Media Catalog ID" : "Content ID"}
                placeholder={`Version Hash or Object ID of the ${form.values.mediaType === "mc" ? "media catalog" : "content"}`}
                {...form.getInputProps("contentId")}
              />
              {
                form.values.mediaType !== "mc" ? null :
                  <TextInput
                    required
                    label="Media Collection ID"
                    {...form.getInputProps("collectionId")}
                  />
              }

              {
                !["v", "lv", "a"].includes(form.values.mediaType) ? null :
                  <Accordion variant="contained">
                    <Accordion.Item key="content-info" value="Content Info">
                      <Accordion.Control>Content Info</Accordion.Control>
                      <Accordion.Panel>
                        <Stack gap="xs">
                          <TextInput
                            label="Title"
                            {...form.getInputProps("title")}
                          />
                          <Textarea
                            label="Description"
                            {...form.getInputProps("description")}
                          />
                          <TextInput
                            label="Headers"
                            description="Text headers that show appear above the title, e.g. release date, rating, etc. Pipe (|) separated"
                            {...form.getInputProps("headerText")}
                          />
                          <TextInput
                            label="Image"
                            description="URL or metadata path"
                            {...form.getInputProps("image")}
                          />
                          <TextInput
                            label="Poster Image"
                            description="URL or metadata path"
                            {...form.getInputProps("posterImage")}
                          />
                        </Stack>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
              }
              {
                ["v", "lv", "a", "mc"].includes(form.values.mediaType) ? null :
                  <TextInput
                    label="Link Path"
                    {...form.getInputProps("linkPath")}
                  />
              }
              {
                ["v", "lv", "a", "mc", "g"].includes(form.values.mediaType) ? null :
                  <JsonInput
                    label="Media URL Parameters"
                    description="Additional URL parameters that should be added when displaying the content"
                    {...form.getInputProps("mediaUrlParameters")}
                  />
              }
            </Stack>

            {
              !["v", "lv", "a", "mc"].includes(form.values.mediaType) ? null :
                <Stack gap="xs" mt="xl">
                  <Title fw={500} order={4}>Playout</Title>
                  {
                    form.values.linkPath && !form.values.offerings ? null :
                      <TextInput
                        label="Offering(s)"
                        placeholder="Comma separated"
                        {...form.getInputProps("offerings")}
                      />
                  }
                  {
                    form.values.offerings && !form.values.linkPath ? null :
                      <TextInput
                        label="Link Path"
                        {...form.getInputProps("linkPath")}
                      />
                  }
                  <Accordion variant="contained">
                    <Accordion.Item key="advanced" value="advanced">
                      <Accordion.Control>Advanced Options</Accordion.Control>
                      <Accordion.Panel>
                        <Stack gap="xs">
                          <Select
                            label="Player Profile"
                            data={[
                              {label: "Default", value: ""},
                              {label: "Low Latency Live", value: "ll"},
                              {label: "Ultra Low Latency Live", value: "ull"}]}
                            {...form.getInputProps("playerProfile")}
                          />
                          <NumberInput
                            label="Maximum Bitrate (bps)"
                            allowNegative={false}
                            allowDecimal={false}
                            step={1}
                            {...form.getInputProps("maxBitrate")}
                          />
                          <NumberInput
                            label="Clip Start Time"
                            allowNegative={false}
                            decimalScale={1}
                            step={0.1}
                            {...form.getInputProps("clipStart")}
                          />
                          <NumberInput
                            label="Clip End Time"
                            allowNegative={false}
                            decimalScale={1}
                            step={0.1}
                            {...form.getInputProps("clipEnd")}
                          />
                          <JsonInput
                            label="Custom HLS.js Options"
                            autosize
                            minRows={2}
                            {...form.getInputProps("hlsOptions")}
                          />
                        </Stack>
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>
                </Stack>
            }

            <Stack gap="xs" mt="xl">
              <Title fw={500} order={4}>Authorization</Title>
              <TextInput
                label="Auth Token"
                {...form.getInputProps("authorizationToken")}
              />
              <Checkbox
                my="xs"
                label="Use Ticket Code Authorization"
                {...form.getInputProps("promptTicket", { type: "checkbox" })}
              />
              {
                !form.values.promptTicket ? null :
                  <Paper withBorder p="md" ml="md">
                    <Stack gap="xs">
                      <Title fw={500} order={5}>Ticket Parameters</Title>
                      <TextInput
                        label="Tenant ID"
                        required
                        {...form.getInputProps("tenantId")}
                      />
                      <TextInput
                        label="NTP ID"
                        required
                        {...form.getInputProps("ntpId")}
                      />
                      <TextInput
                        label="Ticket Code"
                        // Non video types don't support ticket prompt
                        required={!["v", "lv", "a", "mc"].includes(form.values.mediaType)}
                        {...form.getInputProps("ticketCode")}
                      />
                      <TextInput
                        label="Ticket Subject"
                        {...form.getInputProps("ticketSubject")}
                      />
                    </Stack>
                  </Paper>
              }
            </Stack>

            {
              !["v", "lv", "a", "mc"].includes(form.values.mediaType) ? null :
                <Stack gap="xs" mt="xl">
                  <Title fw={500} order={4}>Player</Title>
                  <Select
                    label="Player Interface"
                    description="Select between the web and TV UI"
                    data={[
                      {label: "Web", value: ""},
                      {label: "TV", value: EluvioPlayerParameters.ui.TV}
                    ]}
                    {...form.getInputProps("ui")}
                  />
                  <Select
                    label="Autoplay"
                    description="Note: Most browsers do not allow autoplaying of unmuted content by default. This setting is best-effort."
                    data={["On", "Only When Visible", "Off"]}
                    {...form.getInputProps("autoplay")}
                  />
                  <Select
                    label="Controls"
                    data={[
                      {label: "Hidden", value: ""},
                      {label: "Auto Hide", value: "h"},
                      {label: "Always Visible", value: "s"},
                      {label: "Volume Toggle Only", value: "hv"},
                      {label: "Browser Default", value: "d"},
                    ]}
                    {...form.getInputProps("controls")}
                  />
                  <Checkbox
                    label="Mute Audio"
                    {...form.getInputProps("muted", { type: "checkbox" })}
                  />
                  <Checkbox
                    label="Loop Video"
                    {...form.getInputProps("loop", { type: "checkbox" })}
                  />
                  <Checkbox
                    label="Hide Title"
                    {...form.getInputProps("hideTitle", { type: "checkbox" })}
                  />
                  <Checkbox
                    label="Hide Watermark"
                    {...form.getInputProps("hideWatermark", { type: "checkbox" })}
                  />
                  <Checkbox
                    label="Verify Content"
                    {...form.getInputProps("verifyContent", { type: "checkbox" })}
                  />
                  {
                    form.values.mediaType !== "lv" ? null :
                      <Checkbox
                        label="Live DVR"
                        {...form.getInputProps("dvr", { type: "checkbox" })}
                      />
                  }
                  <Checkbox
                    label="Cap Video Quality to Player Size"
                    description="If specified, the playout quality for video will not exceed the rendered size of the video element. This can improve performance and reduce bandwidth for smaller video elements or user screen sizes by not serving unnecessarily high quality video."
                    {...form.getInputProps("capLevelToPlayerSize", { type: "checkbox" })}
                  />
                </Stack>
            }
            <Stack gap="xs" mt="xl">
              <Title fw={500} order={4}>Embed Frame</Title>
              <Group>
                <NumberInput
                  label="Width"
                  value={dimensions.width}
                  onChange={value => setDimensions({...dimensions, width: value})}
                />
                <NumberInput
                  label="Height"
                  value={dimensions.height}
                  onChange={value => setDimensions({...dimensions, height: value})}
                />
              </Group>
            </Stack>
            <Group justify="flex-end" mt={50}>
              <Button type="submit">Generate Embed Link</Button>
            </Group>
          </form>
        </Paper>
      </Container>
      {
        !embedUrl ? null :
          <EmbedFrame dimensions={dimensions} embedUrl={embedUrl} />
      }
    </MantineProvider>
  );
};

createRoot(document.getElementById("app"))
  .render(<Form />);
