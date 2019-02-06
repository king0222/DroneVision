import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import {
  Button,
  Icon,
  List,
  Segment,
  Header,
  Grid,
  ListContent,
} from 'semantic-ui-react';

import NumericInput from 'react-numeric-input';

import { getDrawInstruction } from '../utils/buttonPanelUtils';

import ButtonPanel from '../components/ButtonPanel';
import SceneCanvas from '../components/SceneCanvas';
import {
  changeTab,
  toggleObstacles,
  addSceneObj,
  updateSceneObj,
  updateSelectedObj,
} from '../store/store';

const { ipcRenderer } = window.require('electron');

const defaultObj = {
  length: 2,
  width: 2,
  height: 2,
  position: {
    x: 0,
    y: -4, //accounts for plane shifting + height/2
    z: 0,
  },
  visible: true,
};

// const newObj = {
//   id,
//   name: `obj${id}`,
//   length,
//   width,
//   height,
//   position,
//   ref: obj,
//   lineRef: objLines,
//   visible: true,
// };

let objIdGlobal = 1;
class SceneBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      startingPoint: { x: 0, y: 1, z: 0 },
      limits: {},
    };
  }

  componentDidMount() {
    // Listen for flight import from main process
    // ipcRenderer.on('file-opened', (event, flightInstructions) => {
    //   this.props.updateInstructions(flightInstructions);
    // });
    if (this.props.sceneObjects.length) {
      const limits = this.getNewLimits(this.props.sceneObjects[0]);
      this.setState({ selectedObj: this.props.sceneObjects[0], limits });
    }
  }

  createNewObj = () => {
    const { addSceneObj, updateSelectedObj } = this.props;
    const id = objIdGlobal++;
    const newObj = {
      length: 2,
      width: 2,
      height: 2,
      position: {
        x: 0,
        y: -4, //accounts for plane shifting + height/2
        z: 0,
      },
      visible: true,
    };

    newObj.id = id;
    newObj.name = `obj${id}`;
    updateSelectedObj(newObj.id);
    addSceneObj(newObj);
    const limits = this.getNewLimits(newObj);
    this.setState({ limits });
  };

  handleObjDimChange = (valNum, valStr, inputElem) => {
    const { sceneObjects, updateSceneObj, updateSelectedObj } = this.props;
    const objToUpdate = sceneObjects.find(
      sceneObj => Number(inputElem.id) === sceneObj.id
    );
    // propertyName is length/width/height
    const propertyName = inputElem.name;
    objToUpdate[propertyName] = valNum;
    updateSelectedObj(objToUpdate.id);
    updateSceneObj(objToUpdate);
    const limits = this.getNewLimits(objToUpdate);
    this.setState({ limits });
  };

  handleButtonClick = dirString => {
    const { selectedObjId, sceneObjects, updateSceneObj } = this.props;

    const drawInstruction = getDrawInstruction(dirString);

    const objToUpdate = sceneObjects.find(obj => obj.id === selectedObjId);

    const [z, x, y] = drawInstruction;
    objToUpdate.position.x += x;
    objToUpdate.position.y += y;
    objToUpdate.position.z += z;

    updateSceneObj(objToUpdate);
  };

  getNewLimits = selectedObj => {
    const { scale } = this.props;
    return {
      maxX: scale / 2 - selectedObj.width / 2,
      maxY: scale - 5 - selectedObj.height / 2,
      maxZ: scale / 2 - selectedObj.length / 2,
      minX: -scale / 2 + selectedObj.width / 2,
      minY: -5 + selectedObj.height / 2,
      minZ: -scale / 2 + selectedObj.length / 2,
    };
  };

  handleObjectSelection = evt => {
    const { sceneObjects, updateSelectedObj } = this.props;
    const selectedObj = sceneObjects.find(
      sceneObj => sceneObj.id === Number(evt.currentTarget.id)
    );
    updateSelectedObj(selectedObj.id);
    const limits = this.getNewLimits(selectedObj);
    this.setState({ limits });
  };

  render() {
    const { limits } = this.state;
    const { droneOrientation, sceneObjects, selectedObjId } = this.props;
    const selectedObj = sceneObjects.find(obj => obj.id === selectedObjId);
    let leftDisabled,
      rightDisabled,
      forwardDisabled,
      reverseDisabled,
      upDisabled,
      downDisabled;
    if (selectedObj) {
      leftDisabled = selectedObj.position.x >= limits.maxX;
      rightDisabled = selectedObj.position.x <= limits.minX;
      forwardDisabled = selectedObj.position.z >= limits.maxZ;
      reverseDisabled = selectedObj.position.z <= limits.minZ;
      upDisabled = selectedObj.position.y >= limits.maxY;
      downDisabled = selectedObj.position.y <= limits.minY;
    }
    return (
      <div id="build-screen">
        <Grid columns={3} padded>
          <Grid.Row>
            <Grid.Column width={3}>
              {/* <Grid.Row>
                <Image
                  src={require('../assets/images/helper-images/build-instructions.png')}
                  size="large"
                />
              </Grid.Row> */}
              <Grid.Row>
                <Button onClick={this.createNewObj}>
                  <Button.Content visible>
                    <Icon name="plus" />
                    Create New Object
                  </Button.Content>
                </Button>
              </Grid.Row>
              <div id="object-list">
                <Grid.Row>
                  <Segment inverted>
                    <List divided inverted selection>
                      <List.Header>
                        <i>Your Objects</i>
                      </List.Header>
                      {sceneObjects
                        .sort((a, b) => a.id - b.id)
                        .map(sceneObj => {
                          return (
                            <List.Item
                              // className="flight-message-single"
                              className="flight-message-single"
                              active={selectedObjId === sceneObj.id}
                              key={sceneObj.id}
                              onClick={this.handleObjectSelection}
                              id={sceneObj.id}
                            >
                              <List.Content>Name: {sceneObj.name}</List.Content>
                              <ListContent>
                                {`Width:   `}
                                <NumericInput
                                  id={sceneObj.id}
                                  name={'width'}
                                  size={3}
                                  min={1}
                                  max={this.props.scale}
                                  value={sceneObj.width}
                                  onChange={this.handleObjDimChange}
                                />
                                {`   m.`}
                              </ListContent>
                              <ListContent>
                                {`Length:   `}
                                <NumericInput
                                  id={sceneObj.id}
                                  name={'length'}
                                  size={3}
                                  min={1}
                                  max={this.props.scale}
                                  value={sceneObj.length}
                                  onChange={this.handleObjDimChange}
                                />
                                {`   m.`}
                              </ListContent>
                              <ListContent>
                                {`Height:   `}
                                <NumericInput
                                  id={sceneObj.id}
                                  name={'height'}
                                  size={3}
                                  min={1}
                                  max={this.props.scale}
                                  value={sceneObj.height}
                                  onChange={this.handleObjDimChange}
                                />
                                {`   m.`}
                              </ListContent>
                            </List.Item>
                          );
                        })}
                    </List>
                  </Segment>
                </Grid.Row>
              </div>
            </Grid.Column>
            <Grid.Column width={9}>
              <Header as="h1" dividing id="centered-padded-top">
                <Icon name="building" />
                <Header.Content>
                  Scene Builder
                  <Header.Subheader>
                    <i>Add objects to your scene</i>
                  </Header.Subheader>
                </Header.Content>
              </Header>

              <Grid.Row>
                <Grid.Column>
                  <SceneCanvas />
                </Grid.Column>
              </Grid.Row>
              {sceneObjects.length ? (
                <Grid.Row>
                  <Grid columns={3} padded centered>
                    <Grid.Row>
                      <Grid.Column
                        as="h1"
                        textAlign="center"
                        style={{
                          color: '#ffffff',
                          backgroundColor: '#00a651',
                          borderStyle: 'solid',
                          borderColor: '#484848',
                        }}
                      >
                        Up + Strafe
                        <ButtonPanel
                          leftDisabled={leftDisabled}
                          rightDisabled={rightDisabled}
                          forwardDisabled={forwardDisabled}
                          reverseDisabled={reverseDisabled}
                          allDisabled={upDisabled}
                          clickHandler={this.handleButtonClick}
                          type="U"
                          droneOrientation={droneOrientation}
                        />
                      </Grid.Column>
                      <Grid.Column
                        as="h1"
                        textAlign="center"
                        style={{
                          color: '#ffffff',
                          backgroundColor: '#afafaf',
                          borderStyle: 'solid',
                          borderColor: '#484848',
                        }}
                      >
                        Strafe
                        <ButtonPanel
                          leftDisabled={leftDisabled}
                          rightDisabled={rightDisabled}
                          forwardDisabled={forwardDisabled}
                          reverseDisabled={reverseDisabled}
                          allDisabled={false}
                          clickHandler={this.handleButtonClick}
                          type="C"
                          droneOrientation={droneOrientation}
                        />
                      </Grid.Column>
                      <Grid.Column
                        as="h1"
                        style={{
                          color: '#ffffff',
                          backgroundColor: '#00aeef',
                          borderStyle: 'solid',
                          borderColor: '#484848',
                        }}
                        textAlign="center"
                      >
                        Down + Strafe
                        <ButtonPanel
                          leftDisabled={leftDisabled}
                          rightDisabled={rightDisabled}
                          forwardDisabled={forwardDisabled}
                          reverseDisabled={reverseDisabled}
                          allDisabled={downDisabled}
                          clickHandler={this.handleButtonClick}
                          type="D"
                          droneOrientation={droneOrientation}
                        />
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                </Grid.Row>
              ) : null}

              <Grid.Row>
                <Grid columns={2} padded>
                  <Grid.Column textAlign="center">
                    <Link to={'/'}>
                      <Button onClick={() => this.props.changeTab('run')}>
                        Build Flight Path!
                      </Button>
                    </Link>
                  </Grid.Column>

                  <Grid.Column>
                    {this.props.obstacles ? (
                      <Button onClick={this.props.toggleObstacles}>
                        Remove Obstacles
                      </Button>
                    ) : (
                      <Button onClick={this.props.toggleObstacles}>
                        Insert Obstacles
                      </Button>
                    )}
                  </Grid.Column>
                </Grid>
              </Grid.Row>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}

const mapState = state => {
  return {
    scale: state.scale,
    droneOrientation: state.droneOrientation,
    startingPosition: state.startingPosition,
    voxelSize: state.voxelSize,
    sceneObjects: state.sceneObjects,
    selectedObjId: state.selectedObjId,
  };
};

const mapDispatch = dispatch => {
  return {
    changeTab: tabName => dispatch(changeTab(tabName)),
    toggleObstacles: () => {
      dispatch(toggleObstacles());
    },
    addSceneObj: newObj => {
      dispatch(addSceneObj(newObj));
    },
    updateSceneObj: updatedObj => dispatch(updateSceneObj(updatedObj)),
    updateSelectedObj: objId => dispatch(updateSelectedObj(objId)),
  };
};

export default connect(
  mapState,
  mapDispatch
)(SceneBuilder);
