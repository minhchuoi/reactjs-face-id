import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Progress, Button } from "antd";
import * as faceapi from "face-api.js";
import Webcam from "react-webcam";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

function getMeanPosition(l) {
  return l
    .map((a) => [a.x, a.y])
    .reduce((a, b) => [a[0] + b[0], a[1] + b[1]])
    .map((a) => a / l.length);
}

export default function StepTwo() {
  const videoRef = useRef(null);
  const [showButton, setShowButton] = useState(false);

  const [left, setLeft] = useState(null);
  const [right, setRight] = useState(null);
  const [center, setCenter] = useState(null);
  const [stop, setStop] = useState(false);

  const [count, setCount] = useState(0);
  const [computing, setComputing] = useState(true);

  const text = !left ? (
    <>
      <LeftOutlined />
      <span style={{ padding: "0 12px 0 8px", verticalAlign: "middle" }}>
        Quay mặt sang trái
      </span>
    </>
  ) : !right ? (
    <>
      <span style={{ padding: "0 8px 0 12px", verticalAlign: "middle" }}>
        Quay mặt sang phải
      </span>
      <RightOutlined />
    </>
  ) : (
    <span style={{ padding: "0 12px" }}>Quay mặt về giữa</span>
  );

  const capture = useCallback(
    (setImage, name) => {
      const src = videoRef.current.getScreenshot();
      console.log(src);
    },
    [videoRef]
  );

  useEffect(() => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    ]);
  }, []);

  const onPlay = useCallback(async () => {
    if (stop) return;
    if (!!left && !!right && !!center) return;
    if (!videoRef.current) return;

    const detections = await faceapi
      .detectSingleFace(
        videoRef.current.video,
        new faceapi.TinyFaceDetectorOptions()
      )
      .withFaceLandmarks();

    var eye_right = getMeanPosition(detections["landmarks"].getRightEye());
    var eye_left = getMeanPosition(detections["landmarks"].getLeftEye());
    var nose = getMeanPosition(detections["landmarks"].getNose());

    var ry =
      (eye_left[0] + (eye_right[0] - eye_left[0]) / 2 - nose[0]) /
      detections["landmarks"]["_imgDims"]["_width"];

    var face_val = ry.toFixed(2);

    if (face_val) {
      setComputing(false);
      if (!left && face_val < -0.06) {
        capture(setLeft, "left.png");
        setCount(33.3);
      }
      if (left && !right && face_val >= 0.07) {
        capture(setRight, "right.png");
        setCount(66.6);
      }
      if (left && right && !center && face_val >= -0.06 && face_val < 0.07) {
        capture(setCenter, "center.png");
        setCount(100);
        setStop(true);
      }
    }
  }, [stop, left, right, center, capture]);

  useEffect(() => {
    if (videoRef.current !== null) {
      const ticking = setInterval(async () => {
        await onPlay();
      }, 250);
      return () => {
        clearInterval(ticking);
      };
    }
  }, [onPlay]);

  useEffect(() => {
    if (center && stop) {
    }
  }, [center, stop]);

  return (
    <>
      <div style={{ height: "100vh" }}>
        <Main>
          <Right>
            <RightContent>
              <Camera style={{ width: 600 }}>
                <Webcam
                  audio={false}
                  width={640}
                  height={400}
                  ref={videoRef}
                  screenshotFormat="image/png"
                  videoConstraints={{
                    width: 640,
                    height: 400,
                    facingMode: "user",
                  }}
                  style={{
                    width: "100%",
                    objectFit: "cover",
                  }}
                  onUserMedia={(stream) => {
                    setShowButton(true);
                  }}
                  screenshotQuality={1}
                  mirrored={true}
                  playsInline
                  // forceScreenshotSourceSize={true}
                />
                {showButton && !computing && (
                  <OvalWrapper>
                    <Progress
                      showInfo={false}
                      type="circle"
                      width={300}
                      strokeWidth={4}
                      percent={count}
                      strokeColor="#30D4BA"
                    />
                  </OvalWrapper>
                )}
                {showButton && !computing && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      position: "absolute",
                      width: "100%",
                      bottom: "10px",
                    }}
                  >
                    <Guide>{text}</Guide>
                  </div>
                )}
              </Camera>
              {showButton && (
                <Button
                  onClick={() => {
                    console.log("Quay lại chụp giấy tờ tùy thân");
                    console.log(left);
                  }}
                  style={{ marginTop: 12 }}
                >
                  Quay lại chụp giấy tờ tùy thân
                </Button>
              )}
            </RightContent>
          </Right>
        </Main>
      </div>
    </>
  );
}

const OvalWrapper = styled.div`
  position: absolute;
  width: 100%;
  height: 94%;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Guide = styled.div`
  color: #fff;
  font-size: 16px;
  border-radius: 500px;
  background: rgba(0, 0, 0, 0.34);
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-wrap: wrap;
`;

const Right = styled.div`
  flex: 1;
  padding: 40px;
  text-align: center;
  @media only screen and (max-width: 575.98px) {
    padding: 12px 8px;
  }
`;

const Camera = styled.div`
  margin-bottom: 16px;
  position: relative;
`;

const RightContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
